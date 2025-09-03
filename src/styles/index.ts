import { baseStyles } from './base-styles';
import { permissionStyles } from './permission-styles';
import { chatStyles } from './chat-styles';
import { toolStyles } from './tool-styles';
import { inputStyles } from './input-styles';
import { modalStyles } from './modal-styles';
import { mcpStyles } from './mcp-styles';
import { animationStyles } from './animation-styles';

export const combinedStyles = `
<style>
${baseStyles}
${permissionStyles}
${chatStyles}
${toolStyles}
${inputStyles}
${modalStyles}
${mcpStyles}
${animationStyles}
</style>`;

export default combinedStyles;