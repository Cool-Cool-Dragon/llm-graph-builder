import { NvlOptions } from '@neo4j-nvl/base';
import { GraphType, OptionType, PatternOption } from '../types';
import { getDateTime, getDescriptionForChatMode } from './Utils';
import chatbotmessages from '../assets/ChatbotMessages.json';
import schemaExamples from '../assets/newSchema.json';
export const APP_SOURCES =
  import.meta.env.VITE_REACT_APP_SOURCES && import.meta.env.VITE_REACT_APP_SOURCES !== ''
    ? (import.meta.env.VITE_REACT_APP_SOURCES?.split(',') as string[])
    : ['s3', 'local', 'wiki', 'youtube', 'web'];

export const llms = import.meta.env?.VITE_LLM_MODELS?.trim()
  ? (import.meta.env.VITE_LLM_MODELS.split(',') as string[])
  : [
      'QWEN3_6',
      'QWEN_MAX',
      'QWEN_PLUS',
      'DEEPSEEK_CHAT',
      'SPARK_MAX',
    ];

export const prodllms = import.meta.env.VITE_LLM_MODELS_PROD?.trim()
  ? (import.meta.env.VITE_LLM_MODELS_PROD.split(',') as string[])
  : ['QWEN3_6', 'QWEN_MAX', 'DEEPSEEK_CHAT', 'SPARK_MAX'];

export const chatModeReadableLables: Record<string, string> = {
  vector: '向量',
  graph: '图谱',
  'graph+vector': '图谱+向量',
  fulltext: '全文',
  'graph+vector+fulltext': '图谱+向量+全文',
  'entity search+vector': '实体搜索+向量',
  unavailableChatMode: '选择文件时对话模式不可用',
  selected: '已选择',
  'global search+vector+fulltext': '全局搜索+向量+全文',
};
export const chatModes = import.meta.env?.VITE_CHAT_MODES?.trim()
  ? import.meta.env.VITE_CHAT_MODES?.split(',').map((mode: string) => ({
      mode: mode.trim(),
      description: getDescriptionForChatMode(mode.trim()),
    }))
  : [
      {
        mode: 'vector',
        description: '在文本分块上使用向量索引进行语义相似度搜索。',
      },
      {
        mode: 'graph',
        description: '将文本转换为 Cypher 查询以从图谱数据库精准检索数据。',
      },
      {
        mode: 'graph+vector',
        description: '结合向量索引和图谱连接，进行上下文增强的语义搜索。',
      },
      {
        mode: 'fulltext',
        description: '使用文本分块的全文索引进行快速关键词搜索。',
      },
      {
        mode: 'graph+vector+fulltext',
        description: '融合向量、图谱和全文索引，实现综合检索效果。',
      },
      {
        mode: 'entity search+vector',
        description: '在实体节点上使用向量索引进行高度相关的实体搜索。',
      },
      {
        mode: 'global search+vector+fulltext',
        description:
          '在社区节点上使用向量索引和全文索引，在全球范围内提供准确且感知上下文的回答。',
      },
    ];

export const chunkSize = import.meta.env.VITE_CHUNK_SIZE ? Number(import.meta.env.VITE_CHUNK_SIZE) : 1 * 1024 * 1024;
export const tokenchunkSize = import.meta.env.VITE_TOKENS_PER_CHUNK
  ? Number(import.meta.env.VITE_TOKENS_PER_CHUNK)
  : 100;
export const chunkOverlap = import.meta.env.VITE_CHUNK_OVERLAP ? Number(import.meta.env.VITE_CHUNK_OVERLAP) : 20;
export const chunksToCombine = import.meta.env.VITE_CHUNK_TO_COMBINE
  ? Number(import.meta.env.VITE_CHUNK_TO_COMBINE)
  : 1;
export const defaultTokenChunkSizeOptions = [50, 100, 200, 400, 1000];
export const defaultChunkOverlapOptions = [10, 20, 30, 40, 50];
export const defaultChunksToCombineOptions = [1, 2, 3, 4, 5, 6];

export interface EmbeddingModelOption {
  provider: string;
  model: string;
  dimension: number;
  label: string;
  value: string;
}

export const embeddingModels: EmbeddingModelOption[] = [
  {
    provider: 'sentence-transformer',
    model: 'all-MiniLM-L6-v2',
    dimension: 384,
    label: '本地模型 (Sentence Transformer) all-MiniLM-L6-v2',
    value: 'sentence-transformer-all-MiniLM-L6-v2',
  },
  {
    provider: 'qwen',
    model: 'text-embedding-v3',
    dimension: 1024,
    label: '通义文本嵌入 text-embedding-v3',
    value: 'qwen-text-embedding-v3',
  },
  {
    provider: 'tencent',
    model: 'huanxing-emb-2024-07-31',
    dimension: 1024,
    label: '腾讯语义嵌入 huanxing-emb-2024-07-31',
    value: 'tencent-huanxing-emb-2024-07-31',
  },
  {
    provider: 'sentence-transformer',
    model: 'BAAI/bge-large-zh-v1.5',
    dimension: 1024,
    label: '本地模型 (Sentence Transformer) BAAI/bge-large-zh-v1.5',
    value: 'sentence-transformer-BAAI/bge-large-zh-v1.5',
  },
  {
    provider: 'sentence-transformer',
    model: 'BAAI/bge-base-zh-v1.5',
    dimension: 768,
    label: '本地模型 (Sentence Transformer) BAAI/bge-base-zh-v1.5',
    value: 'sentence-transformer-BAAI/bge-base-zh-v1.5',
  },
  {
    provider: 'sentence-transformer',
    model: 'paraphrase-multilingual-mpnet-v2',
    dimension: 768,
    label: '本地模型 (Sentence Transformer) paraphrase-multilingual-mpnet-v2',
    value: 'sentence-transformer-paraphrase-multilingual-mpnet-v2',
  },
  {
    provider: 'sentence-transformer',
    model: 'all-MiniLM-L12-v2',
    dimension: 384,
    label: '本地模型 (Sentence Transformer) all-MiniLM-L12-v2',
    value: 'sentence-transformer-all-MiniLM-L12-v2',
  },
  {
    provider: 'sentence-transformer',
    model: 'BAAI/bge-m3',
    dimension: 1024,
    label: '本地模型 (Sentence Transformer) BAAI/bge-m3',
    value: 'sentence-transformer-BAAI/bge-m3',
  },
];
export const DEFAULT_EMBEDDING_MODEL: EmbeddingModelOption = {
  provider: 'sentence-transformer',
  model: 'all-MiniLM-L6-v2',
  dimension: 384,
  label: '本地模型 (Sentence Transformer) all-MiniLM-L6-v2',
  value: 'sentence-transformer-all-MiniLM-L6-v2',
};

export const timeperpage = import.meta.env.VITE_TIME_PER_PAGE ? Number(import.meta.env.VITE_TIME_PER_PAGE) : 50;
export const timePerByte = 0.2;
export const largeFileSize = import.meta.env.VITE_LARGE_FILE_SIZE
  ? Number(import.meta.env.VITE_LARGE_FILE_SIZE)
  : 5 * 1024 * 1024;

export const tooltips = {
  generateGraph: '从选中的文件生成图谱',
  deleteFile: '选择一个或多个文件进行删除',
  showGraph: '预览生成的图谱。',
  bloomGraph: '在 Bloom 中可视化图谱',
  deleteSelectedFiles: '待删除的文件',
  previewGraphSelectedFiles: '待预览图谱的文件',
  documentation: '文档',
  github: 'GitHub Issues',
  theme: '亮色 / 暗色 主题',
  settings: '实体图谱抽取设置',
  chat: '开始对话',
  sources: '上传文件',
  deleteChat: '删除',
  maximise: '最大化',
  copy: '复制到剪贴板',
  copied: '已复制',
  stopSpeaking: '停止朗读',
  textTospeech: '文本转语音',
  createSchema: '从文本定义模式',
  useExistingSchema: '从数据库获取模式',
  clearChat: '清除对话历史',
  continue: '继续',
  clearGraphSettings: '清除已配置的图谱模式',
  applySettings: '应用图谱模式',
  openChatPopout: '对话',
  downloadChat: '下载对话记录',
  visualizeGraph: '可视化图谱模式',
  additionalInstructions: '分析模式指令',
  predinedSchema: '预定义模式',
  dataImporterJson: '数据导入器 JSON',
};

export const processTimeUnit = {
  minutes: '分钟',
  seconds: '秒',
};
export const PRODMODELS = ['QWEN3_6', 'QWEN_MAX', 'DEEPSEEK_CHAT', 'SPARK_MAX'];
export const modelTooltipMap: Record<string, string> = {};
export const buttonCaptions = {
  exploreGraphWithBloom: '使用 Bloom 探索图谱',
  showPreviewGraph: '预览图谱',
  deleteFiles: '删除文件',
  generateGraph: '生成图谱',
  dropzoneSpan: '文档、图片、非结构化文本',
  youtube: 'YouTube',
  gcs: 'GCS',
  amazon: 'Amazon S3',
  noLables: '数据库中未找到标签',
  dropYourCreds: '将 neo4j 凭证文件拖放到此处',
  analyze: '分析文本以提取图谱模式',
  connect: '连接',
  disconnect: '断开连接',
  submit: '提交',
  connectToNeo4j: '连接 Neo4j',
  cancel: '取消',
  details: '详情',
  continueSettings: '继续',
  clearSettings: '清除模式',
  ask: '提问',
  applyGraphSchema: '应用',
  provideAdditionalInstructions: '为实体抽取提供处理配置',
  analyzeInstructions: '分析指令',
  helpInstructions: '提供实体抽取的具体指令，例如关注关键主题。',
  importDropzoneSpan: 'JSON 文档',
};

export const URLS = {
  DOCUMENT_INTELLIGENCE: 'https://console.neo4j.io/document-intelligence',
  DOCUMENTATION: 'https://neo4j.com/labs/genai-ecosystem/llm-graph-builder',
  GITHUB_ISSUES: 'https://github.com/neo4j-labs/llm-graph-builder/issues',
};

export const POST_PROCESSING_JOBS: { title: string; description: string }[] = [
  {
    title: 'materialize_text_chunk_similarities',
    description: `此选项优化知识图谱中不同信息片段（文本块）之间的连接。通过利用 k-近邻算法和相似度阈值（KNN_MIN_SCORE 为 0.8），该流程识别并链接具有高语义相似度的文本块。这形成更互联、更具洞察力的知识表示，从而实现更准确、更相关的搜索结果。`,
  },
  {
    title: 'enable_hybrid_search_and_fulltext_search_in_bloom',
    description: `此选项优化知识图谱中的搜索能力。它重建数据库标签的全文索引，确保更快、更高效的信息检索。对于大型知识图谱尤其有益，可显著提升基于关键词搜索的速度并改善整体查询性能。`,
  },
  {
    title: 'materialize_entity_similarities',
    description: `通过生成捕获实体语义含义的数值表示（嵌入向量）来增强实体分析。这支持诸如聚类相似实体、识别重复项和执行基于相似度搜索等任务。`,
  },
  {
    title: 'enable_communities',
    description: '启用实体间的社区创建，以使用 GraphRAG 的本地和全局搜索能力。',
  },
  {
    title: 'graph_schema_consolidation',
    description:
      '此选项利用 LLM 对大型图谱模式进行整合，将大量的节点标签和关系类型合并为更少、更相关的类型，并应用于已抽取和现有的图谱。',
  },
];
export const RETRY_OPIONS = [
  'start_from_beginning',
  'delete_entities_and_start_from_beginning',
  'start_from_last_processed_position',
];
export const batchSize: number = Number(import.meta.env.VITE_BATCH_SIZE ?? '2');

// Graph Constants
export const document = `+ [docs]`;

export const chunks = `+ collect { MATCH p=(c)-[:NEXT_CHUNK]-() RETURN p } // chunk-chain
+ collect { MATCH p=(c)-[:SIMILAR]-() RETURN p } // similar-chunks`;

export const entities = `+ collect { OPTIONAL MATCH (c:Chunk)-[:HAS_ENTITY]->(e), p=(e)-[*0..1]-(:!Chunk) RETURN p}`;

export const docEntities = `+ [docs] 
+ collect { MATCH (c:Chunk)-[:HAS_ENTITY]->(e), p=(e)--(:!Chunk) RETURN p }`;

export const docChunks = `+[chunks]
+collect {MATCH p=(c)-[:FIRST_CHUNK]-() RETURN p} //first chunk
+ collect { MATCH p=(c)-[:NEXT_CHUNK]-() RETURN p } // chunk-chain
+ collect { MATCH p=(c)-[:SIMILAR]-() RETURN p } // similar-chunk`;

export const chunksEntities = `+ collect { MATCH p=(c)-[:NEXT_CHUNK]-() RETURN p } // chunk-chain

+ collect { MATCH p=(c)-[:SIMILAR]-() RETURN p } // similar-chunks
//chunks with entities
+ collect { OPTIONAL MATCH p=(c:Chunk)-[:HAS_ENTITY]->(e)-[*0..1]-(:!Chunk) RETURN p }`;

export const docChunkEntities = `+[chunks]
+collect {MATCH p=(c)-[:FIRST_CHUNK]-() RETURN p} //first chunk
+ collect { MATCH p=(c)-[:NEXT_CHUNK]-() RETURN p } // chunk-chain
+ collect { MATCH p=(c)-[:SIMILAR]-() RETURN p } // similar-chunks
//chunks with entities
+ collect { OPTIONAL MATCH p=(c:Chunk)-[:HAS_ENTITY]->(e)-[*0..1]-(:!Chunk) RETURN p }`;

export const nvlOptions: NvlOptions = {
  allowDynamicMinZoom: true,
  disableWebGL: true,
  maxZoom: 3,
  minZoom: 0.05,
  relationshipThreshold: 0.55,
  useWebGL: false,
  instanceId: 'graph-preview',
  initialZoom: 1,
};

export const queryMap: {
  Document: string;
  Chunks: string;
  Entities: string;
  DocEntities: string;
  DocChunks: string;
  ChunksEntities: string;
  DocChunkEntities: string;
} = {
  Document: 'document',
  Chunks: 'chunks',
  Entities: 'entities',
  DocEntities: 'docEntities',
  DocChunks: 'docChunks',
  ChunksEntities: 'chunksEntities',
  DocChunkEntities: 'docChunkEntities',
};

// export const graphQuery: string = queryMap.DocChunkEntities;
export const graphView: OptionType[] = [
  { label: '词汇图谱', value: queryMap.DocChunks },
  { label: '实体图谱', value: queryMap.Entities },
  { label: '知识图谱', value: queryMap.DocChunkEntities },
];

export const intitalGraphType = (isGDSActive: boolean): GraphType[] => {
  return isGDSActive
    ? ['DocumentChunk', 'Entities', 'Communities'] // GDS is active, include communities
    : ['DocumentChunk', 'Entities']; // GDS is inactive, exclude communities
};

export const graphLabels = {
  showGraphView: 'showGraphView',
  chatInfoView: 'chatInfoView',
  generateGraph: '已生成图谱',
  inspectGeneratedGraphFrom: '检查从以下来源生成的图谱',
  document: '文档',
  chunk: '文本块',
  documentChunk: '文档与文本块',
  entities: '实体',
  resultOverview: '结果概览',
  totalNodes: '节点总数',
  noEntities: '未找到实体',
  selectCheckbox: '请至少选择一个复选框以查看图谱',
  totalRelationships: '关系总数',
  nodeSize: 30,
  docChunk: '文档与文本块',
  community: '社区',
  noNodesRels: '无节点和关系',
  neighborView: 'neighborView',
  chunksInfo: '每次可视化 50 个文本块',
  showSchemaView: 'showSchemaView',
  renderSchemaGraph: '来自数据库模式的图谱',
  generatedGraphFromUserSchema: '来自用户定义模式的图谱',
};

export const RESULT_STEP_SIZE = 25;

export const connectionLabels = {
  notConnected: '未连接',
  graphDataScience: '图谱数据科学',
  graphDatabase: '图谱数据库',
  greenStroke: '绿色',
  redStroke: '红色',
};

export const getDefaultMessage = () => {
  return [{ ...chatbotmessages.listMessages[0], datetime: getDateTime() }];
};

export const appLabels = {
  ownSchema: '或定义您自己的模式',
  predefinedSchema: '选择预定义模式',
  chunkingConfiguration: '选择分块配置',
  graphPatternTuple: '图谱模式',
  selectedPatterns: '已选模式',
  dataImporterSchema: '来自数据导入器的模式',
};

export const LLMDropdownLabel = {
  disabledModels: '禁用的模型在开发版本中可用。在 ',
  devEnv: ' 开发环境中获取更多模型',
};
export const getDefaultSchemaExamples = () => {
  return schemaExamples.map((example) => ({
    label: example.schema,
    value: JSON.stringify(example.triplet),
  }));
};

export function mergeNestedObjects(objects: Record<string, Record<string, number>>[]) {
  return objects.reduce((merged, obj) => {
    for (const key in obj) {
      if (!merged[key]) {
        merged[key] = {};
      }
      for (const innerKey in obj[key]) {
        merged[key][innerKey] = obj[key][innerKey];
      }
    }
    return merged;
  }, {});
}
export function getStoredSchema() {
  const storedSchemas = localStorage.getItem('selectedSchemas');
  if (storedSchemas) {
    const parsedSchemas = JSON.parse(storedSchemas);
    return parsedSchemas.selectedOptions;
  }
  return [];
}
export const metricsinfo: Record<string, string> = {
  faithfulness: '衡量回答在多大程度上准确反映了所提供的信息',
  answer_relevancy: '衡量回答在多大程度上解决了用户的问题',
  rouge_score: '衡量生成答案与参考答案逐词匹配的程度',
  semantic_score: '衡量生成答案理解参考答案含义的程度',
  context_entity_recall: '衡量生成答案和检索到的上下文中都存在实体的召回率',
};
export const SKIP_AUTH = (import.meta.env.VITE_SKIP_AUTH ?? 'true') == 'true';

export const sourceOptions: PatternOption[] = [{ label: 'Person', value: 'Person' }];
export const typeOptions: PatternOption[] = [{ label: 'WORKS_FOR', value: 'WORKS_FOR' }];
export const targetOptions: PatternOption[] = [{ label: 'Company', value: 'Company' }];

export const LOCAL_KEYS = {
  source: 'customSourceOptions',
  type: 'customTypeOptions',
  target: 'customTargetOptions',
};
