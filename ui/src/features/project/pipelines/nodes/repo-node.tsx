import { faDocker, faGitAlt } from '@fortawesome/free-brands-svg-icons';
import {
  faAnchor,
  faBuilding,
  faCircleNotch,
  faExclamationCircle,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { useContext, useMemo } from 'react';

import { ColorContext } from '@ui/context/colors';
import { urlForImage } from '@ui/utils/url';

import { MessageTooltip } from '../message-tooltip';
import { NodeDimensions, NodeType, RepoNodeType } from '../types';

import * as styles from './repo-node.module.less';

export const RepoNodeDimensions = () =>
  ({
    width: 185,
    height: 110
  }) as NodeDimensions;

type Props = {
  nodeData: RepoNodeType;
  children?: React.ReactNode;
  onClick?: () => void;
};

const ico = {
  [NodeType.REPO_IMAGE]: faDocker,
  [NodeType.REPO_GIT]: faGitAlt,
  [NodeType.WAREHOUSE]: faBuilding,
  [NodeType.REPO_CHART]: faAnchor
};

export const RepoNode = ({ nodeData, children, onClick }: Props) => {
  const { warehouseColorMap } = useContext(ColorContext);
  const type = nodeData.type;
  const value =
    type === NodeType.REPO_CHART
      ? nodeData?.data?.repoURL || ''
      : type === NodeType.WAREHOUSE
        ? nodeData?.data?.metadata?.name || ''
        : nodeData?.data?.repoURL || '';

  const [hasError, message, refreshing] = useMemo(() => {
    let hasError = false;
    let message: string | null = null;
    let refreshing = nodeData.refreshing;

    if (type === NodeType.WAREHOUSE) {
      let hasReconcilingCondition = false;
      let notReady = false;

      for (const condition of nodeData?.data?.status?.conditions || []) {
        if (condition.type === 'Healthy' && condition.status === 'False') {
          hasError = true;
          message = condition.message || null;
        }
        if (condition.type === 'Reconciling') {
          hasReconcilingCondition = true;
          if (condition.status === 'True') {
            refreshing = true;
          }
        }
        if (condition.type === 'Ready' && condition.status === 'False') {
          notReady = true;
          message = condition.message || null;
        }
      }
      if (notReady && !hasReconcilingCondition) {
        hasError = true;
      }
    }

    return [hasError, message, refreshing];
  }, [nodeData]);

  return (
    <div
      className={classNames([
        styles.node,
        {
          'cursor-pointer hover:text-white transition-all hover:bg-gray-300': !!onClick
        }
      ])}
      style={
        type === NodeType.WAREHOUSE
          ? { borderColor: warehouseColorMap[nodeData?.data?.metadata?.name || ''] }
          : {}
      }
      onClick={() => onClick?.()}
    >
      <h3 className='flex justify-between gap-2'>
        <div className='text-ellipsis whitespace-nowrap overflow-x-hidden py-1'>
          {nodeData.type === NodeType.WAREHOUSE ? nodeData.data?.metadata?.name : 'Subscription'}
        </div>
        <div className='flex items-center gap-1'>
          {refreshing && <FontAwesomeIcon icon={faCircleNotch} spin className='mr-2' />}
          {nodeData.type === NodeType.WAREHOUSE && hasError && (
            <MessageTooltip
              message={
                <div className='flex flex-col gap-4 overflow-y-scroll text-wrap max-h-48'>
                  <div
                    className='cursor-pointer min-w-0'
                    onClick={() => {
                      if (message) {
                        navigator.clipboard.writeText(message);
                      }
                    }}
                  >
                    <div className='flex text-wrap'>
                      <FontAwesomeIcon icon={faExclamationCircle} className='mr-2 mt-1 pl-1' />
                      {message}
                    </div>
                  </div>
                </div>
              }
              icon={faExclamationCircle}
              iconClassName='text-red-500'
            />
          )}
          {type && (
            <FontAwesomeIcon
              icon={ico[type]}
              style={
                type === NodeType.WAREHOUSE
                  ? { color: warehouseColorMap[nodeData.data?.metadata?.name || ''] }
                  : {}
              }
            />
          )}
        </div>
      </h3>
      <div className={styles.body}>
        {nodeData.type !== NodeType.WAREHOUSE && (
          <div className={styles.valueContainer}>
            <div className={styles.repoLabel}>REPO URL</div>
            <Tooltip title={value}>
              <a
                href={
                  nodeData.type === NodeType.REPO_IMAGE
                    ? urlForImage(value)
                    : `https://${value.replace('https://', '')}`
                }
                className={styles.value}
                target='_blank'
                rel='noreferrer'
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} size='sm' className='mr-2' />
                {value}
              </a>
            </Tooltip>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
