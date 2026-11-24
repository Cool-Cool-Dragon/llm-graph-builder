import React from 'react';
import { Banner } from '@neo4j-ndl/react';

export default class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, errorMessage: '', errorName: '' };

  static getDerivedStateFromError(_error: unknown) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ ...this.state, errorMessage: error.message, errorName: error.name });
    console.log({ error });
    console.log({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='n-size-full n-flex n-flex-col n-items-center n-justify-center n-rounded-md n-bg-palette-neutral-bg-weak n-box-border'>
          <Banner
            hasIcon={true}
            type='info'
            description={
              this.state.errorMessage === 'Missing required parameter client_id.'
                ? '请提供 Google Client ID 以使用 GCS 源'
                : this.state.errorName === 'InvalidCharacterError'
                  ? '我们已更新安全机制。为确保顺畅访问，请清除本地存储'
                  : '抱歉，加载此页面时出现问题'
            }
            title='出现错误'
            className='mt-8'
            actions={
              this.state.errorName === 'InvalidCharacterError'
                ? [
                    {
                      label: '清除存储',
                      onClick: () => {
                        localStorage.clear();
                        window.location.reload();
                      },
                    },
                  ]
                : [
                    {
                      label: '文档',
                      href: 'https://github.com/neo4j-labs/llm-graph-builder',
                      target: '_blank',
                    },
                  ]
            }
            usage='inline'
          ></Banner>
        </div>
      );
    }
    return this.props.children;
  }
}
