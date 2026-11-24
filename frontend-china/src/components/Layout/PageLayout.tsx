import { Dispatch, lazy, SetStateAction, Suspense, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import SideNav from './SideNav';
import DrawerDropzone from './DrawerDropzone';
import DrawerChatbot from './DrawerChatbot';
import Content from '../Content';
import { clearChatAPI, getChatHistoryAPI } from '../../services/QnaAPI';
import { useCredentials } from '../../context/UserCredentials';
import { connectionState, Messages, OptionType } from '../../types';
import { useMessageContext } from '../../context/UserMessages';
import { useMediaQuery, Spotlight, SpotlightTour, useSpotlightContext } from '@neo4j-ndl/react';
import { useFileContext } from '../../context/UsersFiles';
import SchemaFromTextDialog from '../../components/Popups/GraphEnhancementDialog/EnitityExtraction/SchemaFromTextDialog';
import useSpeechSynthesis from '../../hooks/useSpeech';
import FallBackDialog from '../UI/FallBackDialog';
import { envConnectionAPI } from '../../services/ConnectAPI';
import { healthStatus } from '../../services/HealthStatus';
import { verifyAuthAPI } from '../../services/AuthVerify';
import { useAuth0 } from '@auth0/auth0-react';
import { showErrorToast } from '../../utils/Toasts';
import { APP_SOURCES } from '../../utils/Constants';
import { createDefaultFormData } from '../../API/Index';
import LoadDBSchemaDialog from '../Popups/GraphEnhancementDialog/EnitityExtraction/LoadExistingSchema';
import PredefinedSchemaDialog from '../Popups/GraphEnhancementDialog/EnitityExtraction/PredefinedSchemaDialog';
import { SKIP_AUTH } from '../../utils/Constants';
import { useNavigate } from 'react-router';
import {
  convertChatHistoryToMessages,
  deduplicateByFullPattern,
  deduplicateNodeByValue,
  fetchAndStoreEmbeddingSettings,
} from '../../utils/Utils';
import DataImporterSchemaDialog from '../Popups/GraphEnhancementDialog/EnitityExtraction/DataImporter';

const loadChatHistory = async (setMessages: Dispatch<SetStateAction<Messages[]>>) => {
  try {
    const chatHistoryResponse = await getChatHistoryAPI();
    const history = chatHistoryResponse?.data?.data?.messages;
    if (Array.isArray(history) && history.length) {
      setMessages(convertChatHistoryToMessages(history));
    }
  } catch (error) {
    console.log('加载聊天记录时出错:', error);
  }
};
const GCSModal = lazy(() => import('../DataSources/GCS/GCSModal'));
const S3Modal = lazy(() => import('../DataSources/AWS/S3Modal'));
const GenericModal = lazy(() => import('../WebSources/GenericSourceModal'));
const ConnectionModal = lazy(() => import('../Popups/ConnectionModal/ConnectionModal'));
const spotlightsforunauthenticated = [
  {
    target: 'loginbutton',
    children: (
      <>
        <Spotlight.Header>使用 Neo4j 登录</Spotlight.Header>
        <Spotlight.Body>使用 Google 账户或电子邮件地址登录</Spotlight.Body>
      </>
    ),
  },
  {
    target: 'connectbutton',
    children: (
      <>
        <Spotlight.Header>连接 Neo4j 数据库</Spotlight.Header>
        <Spotlight.Body>填写 Neo4j 凭据并点击连接</Spotlight.Body>
      </>
    ),
  },
  {
    target: 'dropzone',
    children: (
      <>
        <Spotlight.Header>上传文档</Spotlight.Header>
        <Spotlight.Body>上传任何非结构化文件</Spotlight.Body>
      </>
    ),
  },
  {
    target: 'llmdropdown',
    children: (
      <>
        <Spotlight.Header>选择所需的 LLM</Spotlight.Header>
      </>
    ),
  },
  {
    target: 'generategraphbtn',
    children: (
      <>
        <Spotlight.Header>开始提取过程</Spotlight.Header>
        <Spotlight.Body>点击生成图谱</Spotlight.Body>
      </>
    ),
  },
  {
    target: 'visualizegraphbtn',
    children: (
      <>
        <Spotlight.Header>可视化知识图谱</Spotlight.Header>
        <Spotlight.Body>选择表格中一个或多个已完成的文件进行可视化</Spotlight.Body>
      </>
    ),
  },
  {
    target: 'chatbtn',
    children: (
      <>
        <Spotlight.Header>询问与文档相关的问题</Spotlight.Header>
      </>
    ),
  },
];
const spotlights = [
  {
    target: 'connectbutton',
    children: (
      <>
        <Spotlight.Header>连接 Neo4j 数据库</Spotlight.Header>
        <Spotlight.Body>填写 Neo4j 凭据并点击连接</Spotlight.Body>
      </>
    ),
  },
  {
    target: 'dropzone',
    children: (
      <>
        <Spotlight.Header>上传文档</Spotlight.Header>
        <Spotlight.Body>上传任何非结构化文件</Spotlight.Body>
      </>
    ),
  },
  {
    target: 'llmdropdown',
    children: (
      <>
        <Spotlight.Header>选择所需的 LLM</Spotlight.Header>
      </>
    ),
  },
  {
    target: 'generategraphbtn',
    children: (
      <>
        <Spotlight.Header>开始提取过程</Spotlight.Header>
        <Spotlight.Body>点击生成图谱</Spotlight.Body>
      </>
    ),
  },
  {
    target: 'visualizegraphbtn',
    children: (
      <>
        <Spotlight.Header>可视化知识图谱</Spotlight.Header>
        <Spotlight.Body>选择表格中一个或多个已完成的文件进行可视化</Spotlight.Body>
      </>
    ),
  },
  {
    target: 'chatbtn',
    children: (
      <>
        <Spotlight.Header>询问与文档相关的问题</Spotlight.Header>
      </>
    ),
  },
];
const PageLayout: React.FC = () => {
  const [openConnection, setOpenConnection] = useState<connectionState>({
    openPopUp: false,
    chunksExists: false,
    vectorIndexMisMatch: false,
    chunksExistsWithDifferentDimension: false,
  });
  const isLargeDesktop = useMediaQuery(`(min-width:1440px )`);
  const [isLeftExpanded, setIsLeftExpanded] = useState<boolean>(false);
  const [isRightExpanded, setIsRightExpanded] = useState<boolean>(false);
  const [showChatBot, setShowChatBot] = useState<boolean>(false);
  const [showDrawerChatbot, setShowDrawerChatbot] = useState<boolean>(true);
  const [showEnhancementDialog, toggleEnhancementDialog] = useReducer((s) => !s, false);
  const [shows3Modal, toggleS3Modal] = useReducer((s) => !s, false);
  const [showGCSModal, toggleGCSModal] = useReducer((s) => !s, false);
  const [showGenericModal, toggleGenericModal] = useReducer((s) => !s, false);
  const {
    connectionStatus,
    setIsReadOnlyUser,
    setConnectionStatus,
    setGdsActive,
    setIsBackendConnected,
    setUserCredentials,
    setErrorMessage,
    setShowDisconnectButton,
    showDisconnectButton,
    setIsGCSActive,
  } = useCredentials();
  const {
    setShowTextFromSchemaDialog,
    showTextFromSchemaDialog,
    setSchemaTextPattern,
    schemaLoadDialog,
    setSchemaLoadDialog,
    setPredefinedSchemaDialog,
    setDbPattern,
    setSchemaValNodes,
    predefinedSchemaDialog,
    setSchemaValRels,
    setDbNodes,
    setDbRels,
    setPreDefinedNodes,
    setPreDefinedRels,
    setPreDefinedPattern,
    allPatterns,
    selectedNodes,
    selectedRels,
    dataImporterSchemaDialog,
    setDataImporterSchemaDialog,
    setImporterPattern,
    setImporterNodes,
    setImporterRels,
    setSourceOptions,
    setTargetOptions,
    setTypeOptions,
  } = useFileContext();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth0();

  useEffect(() => {
    try {
      const email = user?.email?.trim();
      if (isAuthenticated && email) {
        localStorage.setItem('currentUserEmail', email);
        const existing = localStorage.getItem('neo4j.connection');
        if (existing) {
          const parsed = JSON.parse(existing);
          parsed.email = email;
          localStorage.setItem('neo4j.connection', JSON.stringify(parsed));
        }
      } else if (!isAuthenticated) {
        localStorage.removeItem('currentUserEmail');
        const existing = localStorage.getItem('neo4j.connection');
        if (existing) {
          const parsed = JSON.parse(existing);
          parsed.email = '';
          localStorage.setItem('neo4j.connection', JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn('localStorage 电子邮件同步失败', e);
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (!isLargeDesktop) {
      setIsLeftExpanded(false);
      setIsRightExpanded(false);
      setShowDrawerChatbot(false);
    } else {
      setShowDrawerChatbot(true);
    }
  }, [isLargeDesktop]);

  const { cancel } = useSpeechSynthesis();
  const { setActiveSpotlight } = useSpotlightContext();
  const isYoutubeOnly = useMemo(
    () => APP_SOURCES.includes('youtube') && !APP_SOURCES.includes('wiki') && !APP_SOURCES.includes('web'),
    []
  );
  const isWikipediaOnly = useMemo(
    () => APP_SOURCES.includes('wiki') && !APP_SOURCES.includes('youtube') && !APP_SOURCES.includes('web'),
    []
  );
  const isWebOnly = useMemo(
    () => APP_SOURCES.includes('web') && !APP_SOURCES.includes('youtube') && !APP_SOURCES.includes('wiki'),
    []
  );
  const { messages, setClearHistoryData, clearHistoryData, setMessages, setIsDeleteChatLoading } = useMessageContext();
  const isFirstTimeUser = useMemo(() => localStorage.getItem('neo4j.connection') === null, []);

  const [combinedPatternsVal, setCombinedPatternsVal] = useState<string[]>([]);
  const [combinedNodesVal, setCombinedNodesVal] = useState<OptionType[]>([]);
  const [combinedRelsVal, setCombinedRelsVal] = useState<OptionType[]>([]);

  useEffect(() => {
    if (allPatterns.length > 0 && selectedNodes.length > 0 && selectedRels.length > 0) {
      setCombinedPatternsVal(allPatterns);
      setCombinedNodesVal(selectedNodes as OptionType[]);
      setCombinedRelsVal(selectedRels as OptionType[]);
    }
  }, [allPatterns, selectedNodes, selectedRels]);

  useEffect(() => {
    // 等待 Auth0 恢复会话（刷新/新标签页）以便启动调用
    // 携带有效的 bearer token 且此效果不会在每次页面加载时运行两次。
    if (!SKIP_AUTH && isAuthLoading) {
      return;
    }
    async function initializeConnection() {
      // 在任何其他 API 调用之前验证身份
      if (!SKIP_AUTH && isAuthenticated) {
        const isTokenValid = await verifyAuthAPI();
        if (!isTokenValid) {
          showErrorToast('会话验证失败。请重新登录。');
          return;
        }
      }
      // 获取后端健康状态
      try {
        const response = await healthStatus();
        setIsBackendConnected(response.data.healthy);
      } catch (error) {
        setIsBackendConnected(false);
      }
      // 设置断开按钮状态
      const handleDisconnectButtonState = (isModalOpen: boolean) => {
        setShowDisconnectButton(isModalOpen);
        localStorage.setItem('disconnectButtonState', isModalOpen ? 'true' : 'false');
      };
      try {
        const backendApiResponse = await envConnectionAPI();
        const connectionData = backendApiResponse.data;
        console.log('连接数据:', connectionData.data);
        if (connectionData.data && connectionData.status === 'Success') {
          localStorage.setItem(
            'embedding.dimensions',
            JSON.stringify({
              db_vector_dimension: connectionData.data.db_vector_dimension,
              application_dimension: connectionData.data.application_dimension,
              userDbVectorIndex: connectionData.data.db_vector_dimension,
            })
          );

          const credentials = {
            uri: connectionData.data.uri,
            isReadonlyUser: !connectionData.data.write_access,
            isgdsActive: connectionData.data.gds_status,
            isGCSActive: connectionData.data.gcs_file_cache === 'True',
            chunksTobeProcess: Number(connectionData.data.chunk_to_be_created),
            email: user?.email ?? '',
            connection: 'backendApi',
            database: connectionData.data.database,
          };
          setIsGCSActive(credentials.isGCSActive);
          setUserCredentials(credentials);
          createDefaultFormData({ uri: credentials.uri, email: credentials.email ?? '' });
          setGdsActive(credentials.isgdsActive);
          setConnectionStatus(Boolean(connectionData.data.graph_connection));
          setIsReadOnlyUser(!connectionData.data.write_access);
          handleDisconnectButtonState(false);
          await fetchAndStoreEmbeddingSettings(credentials.uri, credentials.email ?? '');
          if (connectionData.data.graph_connection) {
            await loadChatHistory(setMessages);
          }
        } else if (!connectionData.data && connectionData.status === 'Success') {
          const storedCredentials = localStorage.getItem('neo4j.connection');
          if (storedCredentials) {
            const credentials = JSON.parse(storedCredentials);
            const authedEmail = user?.email ?? '';
            credentials.email = authedEmail || credentials.email || '';

            credentials.password = atob(credentials.password);
            setUserCredentials(credentials);
            createDefaultFormData({
              uri: credentials.uri,
              database: credentials.database,
              userName: credentials.userName,
              password: credentials.password,
              email: credentials.email,
            });
            setIsGCSActive(credentials.isGCSActive);
            setGdsActive(credentials.isgdsActive);
            setConnectionStatus(Boolean(credentials.connection === 'connectAPI'));
            if (credentials.isReadonlyUser !== undefined) {
              setIsReadOnlyUser(credentials.isReadonlyUser);
            }
            handleDisconnectButtonState(true);
            await fetchAndStoreEmbeddingSettings(credentials.uri, credentials.email ?? '');
            if (credentials.connection === 'connectAPI') {
              await loadChatHistory(setMessages);
            }
          } else {
            handleDisconnectButtonState(true);
          }
        } else {
          setErrorMessage(backendApiResponse?.data?.error);
          handleDisconnectButtonState(true);
          console.log('else 条件中存在错误');
        }
      } catch (error) {
        if (error instanceof Error) {
          showErrorToast(error.message);
        }
      }
    }
    initializeConnection();
    if (!isAuthenticated && isFirstTimeUser) {
      setActiveSpotlight('loginbutton');
    }

    if ((isAuthenticated || SKIP_AUTH) && isFirstTimeUser) {
      setActiveSpotlight('connectbutton');
    }
  }, [isAuthenticated, isAuthLoading, isFirstTimeUser]);

  const toggleLeftDrawer = useCallback(() => {
    if (isLargeDesktop) {
      setIsLeftExpanded((old) => !old);
    } else {
      setIsLeftExpanded(false);
    }
  }, [isLargeDesktop]);
  const toggleRightDrawer = useCallback(() => {
    if (isLargeDesktop) {
      setIsRightExpanded((prev) => !prev);
    } else {
      setIsRightExpanded(false);
    }
  }, [isLargeDesktop]);

  const deleteOnClick = useCallback(async () => {
    try {
      setClearHistoryData(true);
      setIsDeleteChatLoading(true);
      cancel();
      const response = await clearChatAPI(sessionStorage.getItem('session_id') ?? '');
      setIsDeleteChatLoading(false);
      if (response.data.status === 'Success') {
        const date = new Date();
        setMessages([
          {
            datetime: `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
            id: 2,
            modes: {
              'graph+vector+fulltext': {
                message:
                  '欢迎使用 Neo4j 知识图谱聊天。您可以询问与已完全处理的文档相关的问题。',
              },
            },
            user: 'chatbot',
            currentMode: 'graph+vector+fulltext',
          },
        ]);
        navigate('.', { replace: true, state: null });
      }
    } catch (error) {
      setIsDeleteChatLoading(false);
      console.log(error);
      setClearHistoryData(false);
    }
  }, []);

  const handleApplyPatternsFromText = useCallback(
    (
      newPatterns: string[],
      nodes: OptionType[],
      rels: OptionType[],
      updatedSource: OptionType[],
      updatedTarget: OptionType[],
      updatedType: OptionType[]
    ) => {
      setSchemaTextPattern((prevPatterns: string[]) => {
        const uniquePatterns = Array.from(new Set([...newPatterns, ...prevPatterns]));
        return uniquePatterns;
      });
      setCombinedPatternsVal((prevPatterns: string[]) => {
        const uniquePatterns = Array.from(new Set([...newPatterns, ...prevPatterns]));
        return uniquePatterns;
      });
      setShowTextFromSchemaDialog({
        triggeredFrom: 'schematextApply',
        show: true,
      });
      setSchemaValNodes(nodes);
      setCombinedNodesVal((prevNodes: OptionType[]) => {
        const combined = [...nodes, ...prevNodes];
        return deduplicateNodeByValue(combined);
      });
      setSchemaValRels(rels);
      setCombinedRelsVal((prevRels: OptionType[]) => {
        const combined = [...rels, ...prevRels];
        return deduplicateByFullPattern(combined);
      });
      setSourceOptions((prev) => [...prev, ...updatedSource]);
      setTargetOptions((prev) => [...prev, ...updatedTarget]);
      setTypeOptions((prev) => [...prev, ...updatedType]);
    },
    []
  );

  const handleDbApply = useCallback(
    (
      newPatterns: string[],
      nodes: OptionType[],
      rels: OptionType[],
      updatedSource: OptionType[],
      updatedTarget: OptionType[],
      updatedType: OptionType[]
    ) => {
      setDbPattern((prevPatterns: string[]) => {
        const uniquePatterns = Array.from(new Set([...newPatterns, ...prevPatterns]));
        return uniquePatterns;
      });
      setCombinedPatternsVal((prevPatterns: string[]) => {
        const uniquePatterns = Array.from(new Set([...newPatterns, ...prevPatterns]));
        return uniquePatterns;
      });
      setSchemaLoadDialog({
        triggeredFrom: 'loadExistingSchemaApply',
        show: true,
      });
      setDbNodes(nodes);
      setCombinedNodesVal((prevNodes: OptionType[]) => {
        const combined = [...nodes, ...prevNodes];
        return deduplicateNodeByValue(combined);
      });
      setDbRels(rels);
      setCombinedRelsVal((prevRels: OptionType[]) => {
        const combined = [...rels, ...prevRels];
        return deduplicateByFullPattern(combined);
      });
      setSourceOptions((prev) => [...prev, ...updatedSource]);
      setTargetOptions((prev) => [...prev, ...updatedTarget]);
      setTypeOptions((prev) => [...prev, ...updatedType]);
    },
    []
  );
  const handlePredinedApply = useCallback(
    (
      newPatterns: string[],
      nodes: OptionType[],
      rels: OptionType[],
      updatedSource: OptionType[],
      updatedTarget: OptionType[],
      updatedType: OptionType[]
    ) => {
      setPreDefinedPattern((prevPatterns: string[]) => {
        const uniquePatterns = Array.from(new Set([...newPatterns, ...prevPatterns]));
        return uniquePatterns;
      });
      setCombinedPatternsVal((prevPatterns: string[]) => {
        const uniquePatterns = Array.from(new Set([...newPatterns, ...prevPatterns]));
        return uniquePatterns;
      });
      setPredefinedSchemaDialog({
        triggeredFrom: 'predefinedSchemaApply',
        show: true,
      });
      setPreDefinedNodes(nodes);
      setCombinedNodesVal((prevNodes: OptionType[]) => {
        const combined = [...nodes, ...prevNodes];
        return deduplicateNodeByValue(combined);
      });
      setPreDefinedRels(rels);
      setCombinedRelsVal((prevRels: OptionType[]) => {
        const combined = [...rels, ...prevRels];
        return deduplicateByFullPattern(combined);
      });
      setSourceOptions((prev) => [...prev, ...updatedSource]);
      setTargetOptions((prev) => [...prev, ...updatedTarget]);
      setTypeOptions((prev) => [...prev, ...updatedType]);
    },
    []
  );

  const handleImporterApply = useCallback(
    (
      newPatterns: string[],
      nodes: OptionType[],
      rels: OptionType[],
      updatedSource: OptionType[],
      updatedTarget: OptionType[],
      updatedType: OptionType[]
    ) => {
      setImporterPattern((prevPatterns: string[]) => {
        const uniquePatterns = Array.from(new Set([...newPatterns, ...prevPatterns]));
        return uniquePatterns;
      });
      setCombinedPatternsVal((prevPatterns: string[]) => {
        const uniquePatterns = Array.from(new Set([...newPatterns, ...prevPatterns]));
        return uniquePatterns;
      });
      setDataImporterSchemaDialog({
        triggeredFrom: 'importerSchemaApply',
        show: true,
      });
      setImporterNodes(nodes);
      setCombinedNodesVal((prevNodes: OptionType[]) => {
        const combined = [...nodes, ...prevNodes];
        return deduplicateNodeByValue(combined);
      });
      setImporterRels(rels);
      setCombinedRelsVal((prevRels: OptionType[]) => {
        const combined = [...rels, ...prevRels];
        return deduplicateByFullPattern(combined);
      });
      setSourceOptions((prev) => [...prev, ...updatedSource]);
      setTargetOptions((prev) => [...prev, ...updatedTarget]);
      setTypeOptions((prev) => [...prev, ...updatedType]);
    },
    []
  );

  const openPredefinedSchema = useCallback(() => {
    setPredefinedSchemaDialog({ triggeredFrom: 'predefinedDialog', show: true });
  }, []);

  const openLoadSchema = useCallback(() => {
    setSchemaLoadDialog({ triggeredFrom: 'loadDialog', show: true });
  }, []);

  const openTextSchema = useCallback(() => {
    setShowTextFromSchemaDialog({ triggeredFrom: 'schemadialog', show: true });
  }, []);

  const openDataImporterSchema = useCallback(() => {
    setDataImporterSchemaDialog({ triggeredFrom: 'schemadialog', show: true });
  }, []);

  const openChatBot = useCallback(() => setShowChatBot(true), []);

  return (
    <>
      {!isAuthenticated && !SKIP_AUTH && isFirstTimeUser ? (
        <SpotlightTour
          spotlights={spotlightsforunauthenticated}
          onAction={(target, action) => {
            if (target == 'connectbutton' && action == 'next') {
              if (!isLeftExpanded) {
                toggleLeftDrawer();
              }
            }
            if (target === 'visualizegraphbtn' && action === 'next' && !isRightExpanded) {
              toggleRightDrawer();
            }
            console.log(`导航灯 ${target} 中执行了 ${action} 操作`);
          }}
        />
      ) : (isAuthenticated || SKIP_AUTH) && isFirstTimeUser ? (
        <SpotlightTour
          spotlights={spotlights}
          onAction={(target, action) => {
            if (target == 'connectbutton' && action == 'next') {
              if (!isLeftExpanded) {
                toggleLeftDrawer();
              }
            }
            if (target === 'visualizegraphbtn' && action === 'next' && !isRightExpanded) {
              toggleRightDrawer();
            }
            console.log(`导航灯 ${target} 中执行了 ${action} 操作`);
          }}
        />
      ) : null}

      <Suspense fallback={<FallBackDialog />}>
        <ConnectionModal
          open={openConnection.openPopUp}
          setOpenConnection={setOpenConnection}
          setConnectionStatus={setConnectionStatus}
          isVectorIndexMatch={openConnection.vectorIndexMisMatch}
          chunksExistsWithoutEmbedding={openConnection.chunksExists}
          chunksExistsWithDifferentEmbedding={openConnection.chunksExistsWithDifferentDimension}
        />
      </Suspense>
      <SchemaFromTextDialog
        open={showTextFromSchemaDialog.show}
        onClose={() => {
          setShowTextFromSchemaDialog({ triggeredFrom: '', show: false });
          switch (showTextFromSchemaDialog.triggeredFrom) {
            case 'enhancementtab':
              toggleEnhancementDialog();
              break;
            default:
              break;
          }
        }}
        onApply={handleApplyPatternsFromText}
      ></SchemaFromTextDialog>
      <LoadDBSchemaDialog
        open={schemaLoadDialog.show}
        onClose={() => {
          setSchemaLoadDialog({ triggeredFrom: '', show: false });
          switch (schemaLoadDialog.triggeredFrom) {
            case 'enhancementtab':
              toggleEnhancementDialog();
              break;
            default:
              break;
          }
        }}
        onApply={handleDbApply}
      />
      <PredefinedSchemaDialog
        open={predefinedSchemaDialog.show}
        onClose={() => {
          setPredefinedSchemaDialog({ triggeredFrom: '', show: false });
          switch (predefinedSchemaDialog.triggeredFrom) {
            case 'enhancementtab':
              toggleEnhancementDialog();
              break;
            default:
              break;
          }
        }}
        onApply={handlePredinedApply}
      ></PredefinedSchemaDialog>
      <DataImporterSchemaDialog
        open={dataImporterSchemaDialog.show}
        onClose={() => {
          setDataImporterSchemaDialog({ triggeredFrom: '', show: false });
          switch (dataImporterSchemaDialog.triggeredFrom) {
            case 'enhancementtab':
              toggleEnhancementDialog();
              break;
            default:
              break;
          }
        }}
        onApply={handleImporterApply}
      ></DataImporterSchemaDialog>
      {isLargeDesktop ? (
        <div
          className={`layout-wrapper ${!isLeftExpanded ? 'drawerdropzoneclosed' : ''} ${
            !isRightExpanded ? 'drawerchatbotclosed' : ''
          } ${!isRightExpanded && !isLeftExpanded ? 'drawerclosed' : ''}`}
        >
          <SideNav
            toggles3Modal={toggleS3Modal}
            toggleGCSModal={toggleGCSModal}
            toggleGenericModal={toggleGenericModal}
            isExpanded={isLeftExpanded}
            position='left'
            toggleDrawer={toggleLeftDrawer}
          />
          {isLeftExpanded && (
            <DrawerDropzone
              shows3Modal={shows3Modal}
              showGCSModal={showGCSModal}
              showGenericModal={showGenericModal}
              toggleGCSModal={toggleGCSModal}
              toggleGenericModal={toggleGenericModal}
              toggleS3Modal={toggleS3Modal}
              isExpanded={isLeftExpanded}
            />
          )}
          <Content
            openChatBot={openChatBot}
            showChatBot={showChatBot}
            openTextSchema={openTextSchema}
            openLoadSchema={openLoadSchema}
            openPredefinedSchema={openPredefinedSchema}
            openDataImporterSchema={openDataImporterSchema}
            showEnhancementDialog={showEnhancementDialog}
            toggleEnhancementDialog={toggleEnhancementDialog}
            setOpenConnection={setOpenConnection}
            showDisconnectButton={showDisconnectButton}
            connectionStatus={connectionStatus}
            combinedPatterns={combinedPatternsVal}
            setCombinedPatterns={setCombinedPatternsVal}
            combinedNodes={combinedNodesVal}
            setCombinedNodes={setCombinedNodesVal}
            combinedRels={combinedRelsVal}
            setCombinedRels={setCombinedRelsVal}
          />
          {isRightExpanded && (
            <DrawerChatbot
              messages={messages}
              isExpanded={isRightExpanded}
              clearHistoryData={clearHistoryData}
              connectionStatus={connectionStatus}
            />
          )}
          <SideNav
            messages={messages}
            isExpanded={isRightExpanded}
            position='right'
            toggleDrawer={toggleRightDrawer}
            deleteOnClick={deleteOnClick}
            showDrawerChatbot={showDrawerChatbot}
            setShowDrawerChatbot={setShowDrawerChatbot}
            setIsRightExpanded={setIsRightExpanded}
            clearHistoryData={clearHistoryData}
            toggleGCSModal={toggleGCSModal}
            toggles3Modal={toggleS3Modal}
            toggleGenericModal={toggleGenericModal}
            setIsleftExpanded={setIsLeftExpanded}
          />
        </div>
      ) : (
        <>
          {APP_SOURCES.includes('gcs') && (
            <Suspense fallback={<FallBackDialog />}>
              <GCSModal openGCSModal={toggleGCSModal} open={showGCSModal} hideModal={toggleGCSModal} />
            </Suspense>
          )}
          {APP_SOURCES.includes('s3') && (
            <Suspense fallback={<FallBackDialog />}>
              <S3Modal hideModal={toggleS3Modal} open={shows3Modal} />
            </Suspense>
          )}

          <Suspense fallback={<FallBackDialog />}>
            <GenericModal
              isOnlyYoutube={isYoutubeOnly}
              isOnlyWikipedia={isWikipediaOnly}
              isOnlyWeb={isWebOnly}
              open={showGenericModal}
              closeHandler={toggleGenericModal}
            />
          </Suspense>
          <div className='layout-wrapper drawerclosed'>
            <SideNav
              toggles3Modal={toggleS3Modal}
              toggleGCSModal={toggleGCSModal}
              toggleGenericModal={toggleGenericModal}
              isExpanded={isLeftExpanded}
              position='left'
              toggleDrawer={toggleLeftDrawer}
            />

            <Content
              openChatBot={openChatBot}
              showChatBot={showChatBot}
              openTextSchema={openTextSchema}
              openLoadSchema={openLoadSchema}
              openPredefinedSchema={openPredefinedSchema}
              openDataImporterSchema={openDataImporterSchema}
              showEnhancementDialog={showEnhancementDialog}
              toggleEnhancementDialog={toggleEnhancementDialog}
              setOpenConnection={setOpenConnection}
              showDisconnectButton={showDisconnectButton}
              connectionStatus={connectionStatus}
              combinedPatterns={combinedPatternsVal}
              setCombinedPatterns={setCombinedPatternsVal}
              combinedNodes={combinedNodesVal}
              setCombinedNodes={setCombinedNodesVal}
              combinedRels={combinedRelsVal}
              setCombinedRels={setCombinedRelsVal}
            />
            {isRightExpanded && (
              <DrawerChatbot
                messages={messages}
                isExpanded={isRightExpanded}
                clearHistoryData={clearHistoryData}
                connectionStatus={connectionStatus}
              />
            )}
            <SideNav
              messages={messages}
              isExpanded={isRightExpanded}
              position='right'
              toggleDrawer={toggleRightDrawer}
              deleteOnClick={deleteOnClick}
              showDrawerChatbot={showDrawerChatbot}
              setShowDrawerChatbot={setShowDrawerChatbot}
              setIsRightExpanded={setIsRightExpanded}
              clearHistoryData={clearHistoryData}
              toggleGCSModal={toggleGCSModal}
              toggles3Modal={toggleS3Modal}
              toggleGenericModal={toggleGenericModal}
              setIsleftExpanded={setIsLeftExpanded}
            />
          </div>
        </>
      )}
    </>
  );
};

export default PageLayout;
