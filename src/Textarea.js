import React from 'react';

/**
 * 
 * @param {{ value: string, onChange: (event) => void, [key: string]: any }} param0 
 */
export default function Textarea ({ value, onChange, ...otherProps }) {
    /**
     * @param {React.KeyboardEvent<HTMLTextAreaElement>} event
     */
    function handleKeyDown (event) {
        const { key, currentTarget, shiftKey } = event;
    
        if (key === "Tab") {
            event.preventDefault();
    
            const i = currentTarget.selectionStart;
            const lineStart = value.lastIndexOf("\n", i-1) + 1;

            if (shiftKey) {
                if (value.substr(lineStart, 4) === "    ") {
                    const newValue = value.substring(0,lineStart) + value.substring(lineStart + 4);
                    onChange(newValue);
                    
                    setTimeout(() => currentTarget.setSelectionRange(i - 4, i - 4), 10);
                }
            } else {
                const linePos = i - lineStart;
                const x = 4 - linePos % 4;

                const newValue = value.substring(0,i) + "    ".substring(0,x) + value.substring(i);
                onChange(newValue);
                
                setTimeout(() => currentTarget.setSelectionRange(i + x, i + x), 10);
            }
        }
    
        else if (key === "Enter") {
            event.preventDefault();

            const i = currentTarget.selectionStart;
            const addIndent = value[i-1] === "{";
            const lineStart = value.lastIndexOf("\n", i-1) + 1;
            const match = value.substring(lineStart, i).match(/^ */);
            const newPos = i + match[0].length + 1 + (addIndent ? 4 : 0);

            const newValue = value.substring(0,i) + "\n" + (addIndent ? "    " : "") + match[0] + value.substring(i);
            onChange(newValue);

            setTimeout(() => currentTarget.setSelectionRange(newPos, newPos), 10);
        }
    }

    return <textarea value={value} onChange={e => onChange(e.target.value)} onKeyDown={handleKeyDown} {...otherProps} />;
}