import { Checkbox } from '@neo4j-ndl/react';

function MetricsCheckbox({
  enableReference,
  toggleReferenceVisibility,
  isDisabled = false,
}: {
  enableReference: boolean;
  toggleReferenceVisibility: React.DispatchWithoutAction;
  isDisabled?: boolean;
}) {
  return (
    <Checkbox
      isDisabled={isDisabled}
      label={'提供参考答案以获取更高指标'}
      isChecked={enableReference}
      onChange={toggleReferenceVisibility}
    />
  );
}
export default MetricsCheckbox;
