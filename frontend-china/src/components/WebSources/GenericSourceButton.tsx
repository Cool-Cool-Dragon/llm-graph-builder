import { DataComponentProps } from '../../types';
import { Flex, Typography } from '@neo4j-ndl/react';
import { IconButtonWithToolTip } from '../UI/IconButtonToolTip';
import { InformationCircleIconOutline } from '@neo4j-ndl/react/icons';
import { APP_SOURCES } from '../../utils/Constants';
import WebButton from '../DataSources/Web/WebButton';

export default function GenericButton({ openModal }: DataComponentProps) {
  return (
    <Flex alignItems='center' gap='4'>
      <WebButton openModal={openModal} />
      <Typography variant='body-small'>
        <Flex gap='0'>
          <div className='align-self-center flex! justify-center'>
            <IconButtonWithToolTip
              label='来源信息'
              clean
              text={
                <Typography variant='body-small'>
                  <Flex gap='3' alignItems='flex-start'>
                    {APP_SOURCES != undefined && APP_SOURCES.includes('youtube') && <span>YouTube</span>}
                    {APP_SOURCES != undefined && APP_SOURCES.includes('wiki') && <span>维基百科</span>}
                    {APP_SOURCES != undefined && APP_SOURCES.includes('web') && <span>网站</span>}
                  </Flex>
                </Typography>
              }
            >
              <InformationCircleIconOutline className='w-[22px] h-[22px]' />
            </IconButtonWithToolTip>
          </div>
        </Flex>
      </Typography>
    </Flex>
  );
}
