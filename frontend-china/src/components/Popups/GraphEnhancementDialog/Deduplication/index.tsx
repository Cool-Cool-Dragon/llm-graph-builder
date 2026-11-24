import { Box, TextLink } from '@neo4j-ndl/react';

const ImporterInput = () => {
  return (
    <Box className='py-2'>
      <TextLink isExternalLink={true} href='https://console-preview.neo4j.io/tools/import/models' target='_blank'>
        Aura 数据模型
      </TextLink>
    </Box>
  );
};
export default ImporterInput;
