import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, signal } from '@angular/core';

interface JsonLine {
  text: string;
  path: string;
  indent: number;
  isChangeable: boolean;
  isHighlighted: boolean;
}

@Component({
  selector: 'app-json-viewer',
  imports: [CommonModule],
  templateUrl: './json-viewer.component.html',
  styleUrls: ['./json-viewer.component.css'],
  standalone: true
})
export class JsonViewerComponent {
  json = input<string>('');
  isHidden = signal(true);
  isCopying = signal(false);
  height = signal<number | null>(null);

  highlightedPaths = signal<Set<string>>(new Set());
  private prevJsonObject: unknown = null;

  constructor() {
    effect(() => {
      const raw = this.json();
      if (!raw) {
        this.prevJsonObject = null;
        return;
      }

      try {
        const current = JSON.parse(raw);
        if (this.prevJsonObject) {
          const oldObj = this.prevJsonObject as Record<string, unknown>;
          const newObj = current as Record<string, unknown>;
          
          const oldProps = oldObj?.['properties'] as Record<string, unknown>;
          const newProps = newObj?.['properties'] as Record<string, unknown>;
          const oldId = oldObj?.['id'] || oldProps?.['id'];
          const newId = newObj?.['id'] || newProps?.['id'];

          if (oldId === newId) {
            const diffs = this.getDiffs(this.prevJsonObject, current);
            if (diffs.size > 0) {
              this.highlightedPaths.update(set => {
                const newSet = new Set(set);
                diffs.forEach(path => newSet.add(path));
                return newSet;
              });

              setTimeout(() => {
                this.highlightedPaths.update(set => {
                  const newSet = new Set(set);
                  diffs.forEach(path => newSet.delete(path));
                  return newSet;
                });
              }, 2000);
            }
          }
        }
        this.prevJsonObject = current;
      } catch {
        this.prevJsonObject = null;
      }
    });
  }

  lines = computed(() => {
    const raw = this.json();
    if (!raw) return [];

    try {
      const current = JSON.parse(raw);
      return this.generateLines(current);
    } catch {
      return [{ text: raw, path: 'root', indent: 0, isChangeable: false, isHighlighted: false }];
    }
  });

  private getDiffs(oldObj: unknown, newObj: unknown, path = ''): Set<string> {
    const diffs = new Set<string>();
    
    if (oldObj === null || typeof oldObj !== typeof newObj) {
      if (oldObj !== newObj) diffs.add(path);
      return diffs;
    }

    if (typeof newObj !== 'object' || newObj === null) {
      if (oldObj !== newObj) diffs.add(path);
      return diffs;
    }

    const oldAny = oldObj as Record<string, unknown>;
    const newAny = newObj as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(oldAny || {}), ...Object.keys(newAny)]);
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const subDiffs = this.getDiffs(oldAny?.[key], newAny?.[key], currentPath);
      subDiffs.forEach(d => diffs.add(d));
    }

    return diffs;
  }

  private generateLines(obj: unknown, indent = 0, path = ''): JsonLine[] {
    const lines: JsonLine[] = [];

    if (Array.isArray(obj)) {
      lines.push({ text: '[', path, indent, isChangeable: false, isHighlighted: false });
      obj.forEach((val, i) => {
        const itemLines = this.generateLines(val, indent + 1, `${path}[${i}]`);
        if (i < obj.length - 1) {
          itemLines[itemLines.length - 1].text += ',';
        }
        lines.push(...itemLines);
      });
      lines.push({ text: ']', path, indent, isChangeable: false, isHighlighted: false });
    } else if (typeof obj === 'object' && obj !== null) {
      lines.push({ text: '{', path, indent, isChangeable: false, isHighlighted: false });
      const entries = Object.entries(obj);
      entries.forEach(([key, val], i) => {
        const currentPath = path ? `${path}.${key}` : key;
        const keyText = `"${key}": `;
        
        if (typeof val === 'object' && val !== null) {
          const subLines = this.generateLines(val, indent + 1, currentPath);
          subLines[0].text = keyText + subLines[0].text;
          if (i < entries.length - 1) {
            subLines[subLines.length - 1].text += ',';
          }
          lines.push(...subLines);
        } else {
          const valText = typeof val === 'string' ? `"${val}"` : String(val);
          lines.push({ 
            text: `${keyText}${valText}${i < entries.length - 1 ? ',' : ''}`, 
            path: currentPath, 
            indent: indent + 1, 
            isChangeable: true,
            isHighlighted: this.highlightedPaths().has(currentPath)
          });
        }
      });
      lines.push({ text: '}', path, indent, isChangeable: false, isHighlighted: false });
    } else {
      const valText = typeof obj === 'string' ? `"${obj}"` : String(obj);
      lines.push({ text: valText, path, indent, isChangeable: true, isHighlighted: this.highlightedPaths().has(path) });
    }

    return lines;
  }

  toggleVisibility() {
    this.isHidden.update(value => !value);
  }

  async copyToClipboard() {
    if (this.isCopying()) return;
    
    try {
      await navigator.clipboard.writeText(this.json());
      this.isCopying.set(true);
      setTimeout(() => this.isCopying.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  }

  onResizeStart(event: MouseEvent) {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = this.height() || 400; 

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.max(150, Math.min(800, startHeight + deltaY));
      this.height.set(newHeight);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
}
