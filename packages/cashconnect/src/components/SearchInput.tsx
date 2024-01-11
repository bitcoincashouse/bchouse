import { SvgUtil } from '../utils/SvgUtil'

export function SearchInput({
  onChange = () => null,
}: React.ComponentProps<'input'>) {
  return (
    <div className="wcm-search-input">
      <input type="text" onInput={onChange} placeholder="Search wallets" />
      {SvgUtil.SEARCH_ICON}
    </div>
  )
}
