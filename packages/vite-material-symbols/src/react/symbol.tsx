import { get_icon } from '../font';
import { iconMapping, supportedExports } from '../mappings';

type MaterialSymbolProps = {
  id: string;
  weight?: string;
}

export const MaterialSymbol = ({ id, weight = '400' }: MaterialSymbolProps) => {
  return (
    <div id={id}>

    </div>
  );
}
