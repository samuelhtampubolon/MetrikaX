/**
 * @metrika/ui
 *
 * The legacy widget kit: a reconstruction of the Win32 common control vocabulary in CSS and React.
 * No component here holds a user-visible string of its own. Every label, every accessible name and
 * every message is passed in by the caller in the active locale (ADR-006).
 */

import './tokens.css';
import './components.css';

export {
  TitleBar,
  GroupBox,
  bevelClass,
  type Bevel,
  type TitleBarProps,
  type GroupBoxProps,
} from './components/primitives.tsx';

export {
  NumericField,
  ComboBox,
  PushButton,
  SearchField,
  type NumericFieldProps,
  type ComboBoxProps,
  type ComboBoxOption,
  type PushButtonProps,
  type SearchFieldProps,
} from './components/controls.tsx';

export {
  TreeView,
  ListView,
  StatusBar,
  ProgressBar,
  ResultField,
  DerivationPane,
  type TreeNode,
  type TreeBranch,
  type TreeLeaf,
  type TreeViewProps,
  type ListColumn,
  type ListViewProps,
  type StatusBarProps,
  type ProgressBarProps,
  type ResultFieldProps,
  type DerivationPaneProps,
} from './components/views.tsx';

export {
  MenuBar,
  TabStrip,
  TabPanel,
  ModalDialog,
  PlotCanvas,
  type Menu,
  type MenuItem,
  type MenuBarProps,
  type TabDefinition,
  type TabStripProps,
  type ModalDialogProps,
  type PlotBar,
  type PlotCanvasProps,
} from './components/chrome.tsx';
