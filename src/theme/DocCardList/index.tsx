import type {ReactNode} from 'react';
import DocCardList from '@theme-original/DocCardList';
import type DocCardListType from '@theme/DocCardList';
import type {WrapperProps} from '@docusaurus/types';
import {useCurrentSidebarSiblings} from '@docusaurus/plugin-content-docs/client';

type Props = WrapperProps<typeof DocCardListType>;
type Item = NonNullable<Props['items']>[number];

/**
 * DocCard uses a leading emoji of the label as the card icon. Prepending the `icon` custom prop
 * (`sidebar_custom_props` in doc front matter, `customProps` in `_category_.json`) gives each card
 * its own icon, while the sidebar keeps plain labels.
 */
function withIcon(item: Item): Item {
  const icon = item.customProps?.icon;
  return typeof icon === 'string' ? {...item, label: `${icon} ${item.label}`} : item;
}

function CurrentSidebarDocCardList(props: Props): ReactNode {
  const items = useCurrentSidebarSiblings();
  return <DocCardList {...props} items={items.map(withIcon)} />;
}

export default function DocCardListWrapper(props: Props): ReactNode {
  if (!props.items) {
    return <CurrentSidebarDocCardList {...props} />;
  }
  return <DocCardList {...props} items={props.items.map(withIcon)} />;
}
