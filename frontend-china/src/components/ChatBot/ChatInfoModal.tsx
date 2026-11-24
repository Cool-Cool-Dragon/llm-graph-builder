import {
  Box,
  Typography,
  Flex,
  Tabs,
  Code,
  useCopyToClipboard,
  Banner,
  useMediaQuery,
  Button,
  TextArea,
  IconButton,
} from '@neo4j-ndl/react';
import { DocumentDuplicateIconOutline, ClipboardDocumentCheckIconOutline } from '@neo4j-ndl/react/icons';
import '../../styling/info.css';
import Neo4jRetrievalLogo from '../../assets/images/Neo4jRetrievalLogo.png';
import { ExtendedNode, chatInfoMessage } from '../../types';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import GraphViewButton from '../Graph/GraphViewButton';
import { chunkEntitiesAPI } from '../../services/ChunkEntitiesInfo';
import { tokens } from '@neo4j-ndl/base';
import ChunkInfo from './ChunkInfo';
import EntitiesInfo from './EntitiesInfo';
import SourcesInfo from './SourcesInfo';
import CommunitiesInfo from './CommunitiesInfo';
import { chatModeReadableLables, mergeNestedObjects, llms } from '../../utils/Constants';
import { Relationship } from '@neo4j-nvl/base';
import { getChatMetrics } from '../../services/GetRagasMetric';
import MetricsTab from './MetricsTab';
import { Stack } from '@mui/material';
import { capitalizeWithUnderscore, getNodes } from '../../utils/Utils';
import MultiModeMetrics from './MultiModeMetrics';
import getAdditionalMetrics from '../../services/AdditionalMetrics';
import { withVisibility } from '../../HOC/WithVisibility';
import MetricsCheckbox from './MetricsCheckbox';

const ChatInfoModal: React.FC<chatInfoMessage> = ({
  sources,
  model,
  total_tokens,
  response_time,
  nodeDetails,
  mode,
  cypher_query,
  graphonly_entities,
  error,
  entities_ids,
  metricanswer,
  metriccontexts,
  metricquestion,
  metricmodel,
  nodes,
  chunks,
  infoEntities,
  communities,
  metricDetails,
  relationships,
  infoLoading,
  metricsLoading,
  activeChatmodes,
  metricError,
  multiModelMetrics,
  saveNodes,
  saveChunks,
  saveChatRelationships,
  saveCommunities,
  saveInfoEntitites,
  saveMetrics,
  toggleInfoLoading,
  toggleMetricsLoading,
  saveMultimodemetrics,
}) => {
  const { breakpoints } = tokens;
  const isTablet = useMediaQuery(`(min-width:${breakpoints.xs}) and (max-width: ${breakpoints.lg})`);
  const [activeTab, setActiveTab] = useState<number>(
    error?.length
      ? 10
      : mode === 'global search+vector+fulltext'
        ? 7
        : mode === 'graph'
          ? 4
          : 3
  );
  const [, copy] = useCopyToClipboard();
  const [copiedText, setcopiedText] = useState<boolean>(false);
  const [showMetricsTable, setShowMetricsTable] = useState<boolean>(Boolean(metricDetails));
  const [showMultiModeMetrics, setShowMultiModeMetrics] = useState<boolean>(Boolean(multiModelMetrics.length));
  const [multiModeError, setMultiModeError] = useState<string>('');
  const [enableReference, toggleReferenceVisibility] = useReducer((state: boolean) => !state, false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isAdditionalMetricsEnabled, setIsAdditionalMetricsEnabled] = useState<boolean | null>(
    multiModelMetrics.length > 0 && Object.keys(multiModelMetrics[0]).length > 4
      ? true
      : multiModelMetrics.length > 0 && Object.keys(multiModelMetrics[0]).length <= 4
        ? false
        : null
  );
  const [isAdditionalMetricsWithSingleMode, setIsAdditionalMetricsWithSingleMode] = useState<boolean | null>(
    metricDetails != undefined && Object.keys(metricDetails).length > 3
      ? true
      : metricDetails != undefined && Object.keys(metricDetails).length <= 3
        ? false
        : null
  );
  const actions: React.ComponentProps<typeof IconButton<'button'>>[] = useMemo(
    () => [
      {
        title: 'copy',
        ariaLabel: 'copy',
        children: (
          <>
            {copiedText ? (
              <ClipboardDocumentCheckIconOutline className='n-size-token-7' />
            ) : (
              <DocumentDuplicateIconOutline className='text-palette-neutral-text-icon n-size-token-7' />
            )}
          </>
        ),
        onClick: () => {
          void copy(cypher_query as string);
          setcopiedText(true);
        },
      },
    ],
    [copiedText, cypher_query]
  );

  useEffect(() => {
    const abortcontroller = new AbortController();
    if (
      (mode != 'graph' || error?.trim() !== '') &&
      (!nodes.length || !infoEntities.length || !chunks.length)
    ) {
      (async () => {
        toggleInfoLoading();
        try {
          const response = await chunkEntitiesAPI(nodeDetails, entities_ids, mode, abortcontroller.signal);
          if (response.data.status === 'Failure') {
            throw new Error(response.data.error);
          }
          const nodesData = response?.data?.data?.nodes
            .map((f: Node) => f)
            .filter((node: ExtendedNode) => node.labels.length === 1);
          const nodeIds = new Set(nodesData.map((node: any) => node.element_id));
          const relationshipsData = response?.data?.data?.relationships
            .map((f: Relationship) => f)
            .filter((rel: any) => nodeIds.has(rel.end_node_element_id) && nodeIds.has(rel.start_node_element_id));
          const communitiesData = response?.data?.data?.community_data;
          const chunksData = response?.data?.data?.chunk_data;
          saveInfoEntitites(getNodes(nodesData, mode));
          saveNodes(getNodes(nodesData, mode));
          saveChatRelationships(relationshipsData ?? []);
          saveCommunities(
            (communitiesData ?? [])
              .map((community: { element_id: string }) => {
                const communityScore = nodeDetails?.communitydetails?.find(
                  (c: { id: string }) => c.id === community.element_id
                );
                return {
                  ...community,
                  score: communityScore?.score ?? 1,
                };
              })
              .sort((a: any, b: any) => b.score - a.score)
          );
          saveChunks(
            chunksData
              .map((chunk: any) => {
                const chunkScore = nodeDetails?.chunkdetails?.find((c: any) => c.id === chunk.id);
                return {
                  ...chunk,
                  score: chunkScore?.score,
                };
              })
              .sort((a: any, b: any) => b.score - a.score)
          );
          toggleInfoLoading();
        } catch (error) {
          console.error('Error fetching information:', error);
          toggleInfoLoading();
        }
      })();
    }
    () => {
      setcopiedText(false);
      if (metricsLoading) {
        toggleMetricsLoading();
      }
      abortcontroller.abort();
    };
  }, [nodeDetails, mode, error, metricsLoading]);

  const onChangeTabs = (tabId: number) => {
    setActiveTab(tabId);
  };
  const loadMetrics = async () => {
    // @ts-ignore
    const referenceText = textAreaRef?.current?.value ?? '';
    const metricsPromise = [];
    if (activeChatmodes != undefined && Object.keys(activeChatmodes).length <= 1) {
      setShowMetricsTable(true);
      const [defaultMode] = Object.keys(activeChatmodes);
      try {
        toggleMetricsLoading();
        metricsPromise.push(
          getChatMetrics(metricquestion, [metriccontexts], [metricanswer], metricmodel, [defaultMode])
        );
        if (referenceText.trim() != '') {
          metricsPromise.push(
            getAdditionalMetrics(metricquestion, [metriccontexts], [metricanswer], referenceText, metricmodel, [
              defaultMode,
            ])
          );
          toggleReferenceVisibility();
        }

        const metricsResponse = await Promise.allSettled(metricsPromise);
        const successresponse = [];
        for (let index = 0; index < metricsResponse.length; index++) {
          const metricPromise = metricsResponse[index];
          if (metricPromise.status === 'fulfilled' && metricPromise.value.data.status === 'Success') {
            successresponse.push(metricPromise.value.data.data);
          }
        }
        setIsAdditionalMetricsWithSingleMode(successresponse.length === 2);
        toggleMetricsLoading();
        const mergedState = successresponse.reduce((acc, cur) => {
          if (acc[defaultMode]) {
            acc[defaultMode] = { ...acc[defaultMode], ...cur[defaultMode] };
          } else {
            acc[defaultMode] = cur[defaultMode];
          }
          return acc;
        }, {});
        saveMetrics(mergedState[defaultMode]);
      } catch (error) {
        if (error instanceof Error) {
          setShowMetricsTable(false);
          toggleMetricsLoading();
          console.log('Error in getting chat metrics', error);
          saveMetrics({ faithfulness: 0, answer_relevancy: 0, error: error.message });
        }
      }
    } else if (activeChatmodes != undefined) {
      setShowMultiModeMetrics(true);
      toggleMetricsLoading();
      const values = Object.values(activeChatmodes);
      const keys = Object.keys(activeChatmodes);
      const contextarray = values.map((r) => {
        return r.metric_contexts;
      });
      const answerarray = values.map((r) => {
        return r.metric_answer;
      });
      const modesarray = keys.map((mode) => {
        return mode;
      });
      try {
        metricsPromise.push(
          getChatMetrics(metricquestion, contextarray as string[], answerarray as string[], metricmodel, modesarray)
        );
        if (referenceText.trim() != '') {
          metricsPromise.push(
            getAdditionalMetrics(
              metricquestion,
              contextarray as string[],
              answerarray as string[],
              referenceText,
              metricmodel,
              modesarray
            )
          );
          toggleReferenceVisibility();
        }
        const metricsResponse = await Promise.allSettled(metricsPromise);
        toggleMetricsLoading();
        const successResponse = [];
        for (let index = 0; index < metricsResponse.length; index++) {
          const metricPromise = metricsResponse[index];
          if (metricPromise.status === 'fulfilled' && metricPromise.value.data.status === 'Success') {
            successResponse.push(metricPromise.value.data.data);
          }
        }
        setIsAdditionalMetricsEnabled(successResponse.length === 2);
        const metricsdata = Object.entries(mergeNestedObjects(successResponse)).map(([mode, scores]) => {
          return { mode, ...scores };
        });
        saveMultimodemetrics(metricsdata);
      } catch (error) {
        setShowMultiModeMetrics(false);
        toggleMetricsLoading();
        console.log('Error in getting chat metrics', error);
        if (error instanceof Error) {
          setMultiModeError(error.message);
        }
      }
    }
  };
  const MetricsCheckBoxWithCheck = withVisibility(MetricsCheckbox);
  const TextareaWithCheck = withVisibility(() => (
    <TextArea ref={textAreaRef} isFluid={true} size='large' isOptional={true} label='参考答案'></TextArea>
  ));
  const isMultiModes = useMemo(
    () => activeChatmodes != null && Object.keys(activeChatmodes).length > 1,
    [activeChatmodes]
  );
  const isSingleMode = useMemo(
    () => activeChatmodes != null && Object.keys(activeChatmodes).length <= 1,
    [activeChatmodes]
  );
  return (
    <div className='n-bg-palette-neutral-bg-weak p-4'>
      <div className='flex! flex-row pb-6 items-center mb-2'>
        <img
          src={Neo4jRetrievalLogo}
          style={{ width: isTablet ? 80 : 95, height: isTablet ? 80 : 95, marginRight: 10 }}
          loading='lazy'
          alt='Retrieval-logo'
        />
        <div className='flex! flex-col'>
          <Typography variant='h2'>检索信息</Typography>
          <Typography variant='body-medium' className='mb-2'>
            生成此响应耗时 <span className='font-bold'>{response_time} 秒</span>，
            使用模型 <span className='font-bold'>{model}</span> 消耗{' '}
            <span className='font-bold'>{total_tokens}</span> 个 token，
            在{' '}
            <span className='font-bold'>
              {chatModeReadableLables[mode] !== '向量'
                ? chatModeReadableLables[mode].replace(/\+/g, ' & ')
                : chatModeReadableLables[mode]}
            </span>{' '}
            模式下完成。
          </Typography>
        </div>
      </div>
      {error?.length > 0 ? (
        <Banner type='danger' usage='inline'>
          {error}
        </Banner>
      ) : (
        <Tabs size='large' fill='underline' onChange={onChangeTabs} value={activeTab}>
          {mode === 'global search+vector+fulltext' ? (
            <Tabs.Tab tabId={7}>社区</Tabs.Tab>
          ) : (
            <>
              {mode != 'graph' ? <Tabs.Tab tabId={3}>使用的来源</Tabs.Tab> : <></>}
              {mode != 'graph' ? <Tabs.Tab tabId={5}>文本块</Tabs.Tab> : <></>}
              {mode === 'graph+vector' ||
              mode === 'graph' ||
              mode === 'graph+vector+fulltext' ||
              mode === 'entity search+vector' ? (
                <Tabs.Tab tabId={4}>使用的实体</Tabs.Tab>
              ) : (
                <></>
              )}
              {mode === 'graph' && cypher_query?.trim()?.length ? (
                <Tabs.Tab tabId={6}>生成的 Cypher 查询</Tabs.Tab>
              ) : (
                <></>
              )}
              {mode === 'entity search+vector' && communities.length ? (
                <Tabs.Tab tabId={7}>社区</Tabs.Tab>
              ) : (
                <></>
              )}
              <Tabs.Tab tabId={8}>评估指标</Tabs.Tab>
            </>
          )}
        </Tabs>
      )}
      <Flex className='p-4'>
        <Tabs.TabPanel className='n-flex n-flex-col n-gap-token-4 n-p-token-6' value={activeTab} tabId={3}>
          <SourcesInfo loading={infoLoading} sources={sources} mode={mode} chunks={chunks} />
        </Tabs.TabPanel>
        <Tabs.TabPanel tabId={8} value={activeTab}>
          <Stack spacing={2}>
            <Stack spacing={2}>
              {!llms.includes(metricmodel) && (
                <Banner
                  type='warning'
                  title='不支持的 LLM 模型，请选择其他模型'
                  description={
                    <Typography variant='body-medium'>
                      当前 ragas 评估仅支持以下模型：{' '}
                      {llms.map((s, idx) => (
                        <span className='font-bold' key={s}>
                          {capitalizeWithUnderscore(s) + (idx != llms.length - 1 ? ',' : '')}
                        </span>
                      ))}
                      .
                    </Typography>
                  }
                  usage='inline'
                ></Banner>
              )}
              <Box>
                <Typography variant='body-large'>
                  我们使用多个关键指标来评估对话回答的质量。点击下方按钮，使用
                  <span className='font-bold'>ragas 框架</span>查看本次交互的详细评分。这些评分有助于我们持续提升对话机器人的准确性和有用性。通常需要
                  <span className='font-bold'>约 20 秒</span> 的时间，稍后将显示详细评分。
                </Typography>
              </Box>
            </Stack>
            {showMultiModeMetrics && isMultiModes && (
              <MultiModeMetrics
                error={multiModeError}
                metricsLoading={metricsLoading}
                data={multiModelMetrics}
                isWithAdditionalMetrics={isAdditionalMetricsEnabled}
              ></MultiModeMetrics>
            )}
            {showMetricsTable && isSingleMode && (
              <MetricsTab metricsLoading={metricsLoading} error={metricError} metricDetails={metricDetails} />
            )}
            <MetricsCheckBoxWithCheck
              enableReference={enableReference}
              toggleReferenceVisibility={toggleReferenceVisibility}
              isVisible={
                isSingleMode &&
                !metricsLoading &&
                (isAdditionalMetricsWithSingleMode === false || isAdditionalMetricsWithSingleMode === null)
              }
            />
            <MetricsCheckBoxWithCheck
              enableReference={enableReference}
              toggleReferenceVisibility={toggleReferenceVisibility}
              isVisible={
                isMultiModes &&
                !metricsLoading &&
                (isAdditionalMetricsEnabled === false || isAdditionalMetricsEnabled === null)
              }
            />
            <TextareaWithCheck
              isVisible={
                enableReference &&
                isSingleMode &&
                (isAdditionalMetricsWithSingleMode === false || isAdditionalMetricsWithSingleMode === null)
              }
            />
            <TextareaWithCheck
              isVisible={
                enableReference &&
                isMultiModes &&
                (isAdditionalMetricsEnabled === false || isAdditionalMetricsEnabled === null)
              }
            />
            {isSingleMode &&
              (isAdditionalMetricsWithSingleMode === false || isAdditionalMetricsWithSingleMode === null) && (
                <Button
                  isDisabled={metricsLoading || !llms.includes(metricmodel)}
                  className='w-max self-center mt-4'
                  onClick={loadMetrics}
                >
                  查看详细指标
                </Button>
              )}
            {isMultiModes && (isAdditionalMetricsEnabled === false || isAdditionalMetricsEnabled === null) && (
              <Button
                isDisabled={metricsLoading || !llms.includes(metricmodel)}
                className='w-max self-center mt-4'
                onClick={loadMetrics}
              >
                  查看所有模式的详细指标
              </Button>
            )}
          </Stack>
        </Tabs.TabPanel>
        <Tabs.TabPanel className='n-flex n-flex-col n-gap-token-4 n-p-token-6' value={activeTab} tabId={4}>
          <EntitiesInfo
            loading={infoLoading}
            mode={mode}
            graphonly_entities={graphonly_entities}
            infoEntities={infoEntities}
          />
        </Tabs.TabPanel>
        <Tabs.TabPanel className='n-flex n-flex-col n-gap-token-4 n-p-token-6' value={activeTab} tabId={5}>
          <ChunkInfo chunks={chunks} loading={infoLoading} mode={mode} />
        </Tabs.TabPanel>
        <Tabs.TabPanel value={activeTab} tabId={6}>
          <Code
            code={cypher_query as string}
            actions={actions}
            headerTitle=''
            theme={'vs'}
            className='min-h-40'
            language='cypher'
          />
        </Tabs.TabPanel>
        {mode === 'entity search+vector' || mode === 'global search+vector+fulltext' ? (
          <Tabs.TabPanel className='n-flex n-flex-col n-gap-token-4 n-p-token-6' value={activeTab} tabId={7}>
            <CommunitiesInfo loading={infoLoading} communities={communities} mode={mode} />
          </Tabs.TabPanel>
        ) : (
          <></>
        )}
      </Flex>
      {activeTab == 4 && nodes?.length && relationships?.length && mode !== 'graph' ? (
        <div className='button-container flex! mt-2 justify-center'>
          <GraphViewButton
            nodeValues={nodes}
            relationshipValues={relationships}
            label='用于生成答案的图谱实体'
            viewType='chatInfoView'
          />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
export default ChatInfoModal;
