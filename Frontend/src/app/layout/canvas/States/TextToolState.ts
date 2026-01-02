import { CanvasComponent } from '../canvas.component';
import { calcLineSpace, TextBoxShape } from '../Shapes/TextBoxShape';
import { ShapeStyleProperty } from '../ShapeStyles/ShapeStyle';
import { StyleName } from '../ShapeStyles/StyleName';
import { TextBoxStyle } from '../ShapeStyles/TextBoxStyle';

import { CanvasToolState } from './CanvasToolState';

export class TextToolState extends CanvasToolState {
  #currentTextBox: TextBoxShape | null = null;
  #hoveredTextBox: TextBoxShape | null = null;
  #selectedStart: number | null = null;
  #selectedEnd: number | null = null;

  constructor(canvas: CanvasComponent) {
    super(canvas);
    this.canvas.changeStyle(new TextBoxStyle(this.canvas.style));
    if (this.canvas.tmpCtx) {
      this.canvas.changeCursor('text');
    }
  }

  get currentTextBox() {
    return this.#currentTextBox;
  }

  override setStyleProperty(styleProperty: ShapeStyleProperty): void {
    this.canvas.style.updateProperty(styleProperty);
    if (this.#currentTextBox) {
      this.#currentTextBox.setStyleProperty(styleProperty);
      this.canvas.renderCanvas(false, true);
    }
  }

  private setSelectedEnd(index: number) {
    if (this.#selectedStart !== null) {
      if (index != this.#selectedStart) {
        this.#selectedEnd = index;
        return;
      }
    }
    this.#selectedEnd = null;
  }

  override remove(): void {
    this.releaseCurrentTextBox();
    this.canvas.renderCanvas(true, true);
  }

  private releaseCurrentTextBox() {
    if (this.#currentTextBox) {
      if (this.#currentTextBox.text.length == 0) {
        return;
      } else {
        this.#currentTextBox.ctx = this.canvas.mainCtx;
        this.canvas.shapes.push(this.#currentTextBox);
      }
      this.#currentTextBox = null;
      this.#selectedStart = null;
      this.#selectedEnd = null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override renderMain(): void {}

  override renderTmp(): void {
    if (this.#currentTextBox) {
      this.#currentTextBox.renderEditedShape(
        this.#selectedStart,
        this.#selectedEnd
      );
      this.drawTextBoxRect(this.#currentTextBox);
    }
    if (this.#hoveredTextBox) {
      this.drawTextBoxRect(this.#hoveredTextBox);
    }
  }

  private drawTextBoxRect(textBox: TextBoxShape) {
    this.canvas.tmpCtx.strokeStyle = 'grey';
    this.canvas.tmpCtx.lineWidth = 4 / this.canvas.scale;
    this.canvas.tmpCtx.strokeRect(
      textBox.originX - this.canvas.tmpCtx.lineWidth / 2,
      textBox.originY - this.canvas.tmpCtx.lineWidth / 2,
      textBox.width + this.canvas.tmpCtx.lineWidth,
      textBox.height + this.canvas.tmpCtx.lineWidth
    );
  }

  private findTextBoxOnCursor() {
    let textBox: TextBoxShape | null = null;
    if (
      this.#currentTextBox &&
      this.#currentTextBox.pointInside(
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      )
    ) {
      textBox = this.#currentTextBox;
    } else {
      for (const shape of this.canvas.shapes) {
        if (
          shape instanceof TextBoxShape &&
          shape.pointInside(this.canvas.cursor[0], this.canvas.cursor[1])
        ) {
          textBox = shape;
          break;
        }
      }
    }
    return textBox;
  }

  private createTextBox() {
    this.releaseCurrentTextBox();
    const style = new TextBoxStyle(this.canvas.style);
    const lineSpace = calcLineSpace(style);
    this.#currentTextBox = new TextBoxShape(
      '',
      [
        this.canvas.cursor[0],
        this.canvas.cursor[1] - (style[StyleName.FontSize] / 2 - lineSpace),
      ],
      style,
      this.canvas.tmpCtx,
      false
    );
  }

  private setCurrentTextBox(textBox: TextBoxShape) {
    if (this.#currentTextBox != textBox) {
      const idx = this.canvas.shapes.indexOf(textBox);
      if (idx !== -1) {
        this.canvas.shapes.splice(idx, 1);
      }
      this.releaseCurrentTextBox();
      this.#currentTextBox = textBox;
    }
    this.#currentTextBox.ctx = this.canvas.tmpCtx;
  }

  private removeSelectedRange() {
    if (
      this.#currentTextBox &&
      this.#selectedStart !== null &&
      this.#selectedEnd !== null
    ) {
      this.#selectedStart = this.#currentTextBox.deleteRange(
        this.#selectedStart,
        this.#selectedEnd
      );
      this.#selectedEnd = null;
    }
  }

  override onMouseDown(event: MouseEvent): void {
    const textBox = this.findTextBoxOnCursor();
    if (textBox) {
      this.setCurrentTextBox(textBox);
    } else {
      this.createTextBox();
    }
    if (this.#currentTextBox) {
      this.canvas.changeStyle(this.#currentTextBox.style);

      const index = this.#currentTextBox.indexFromPosition(
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      );
      if (event.shiftKey && this.#selectedStart !== null) {
        this.#selectedEnd = index;
      } else {
        this.#selectedStart = index;
        this.#selectedEnd = null;
      }
    }
  }

  override onPressedMouseMove(_event: MouseEvent): void {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      this.setSelectedEnd(
        this.#currentTextBox.indexFromPosition(
          this.canvas.cursor[0],
          this.canvas.cursor[1]
        )
      );
      this.canvas.renderCanvas(false, true);
    }
  }

  override onHoveringMouseMove(_event: MouseEvent): void {
    const textBox = this.findTextBoxOnCursor();
    if (textBox) {
      this.#hoveredTextBox = textBox;
    } else {
      this.#hoveredTextBox = null;
    }
    this.canvas.renderCanvas(false, true);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  override onMouseUp(_event: MouseEvent): void {}

  override onKeyPress(event: KeyboardEvent): void {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      if (event.key === 'Enter') {
        this.insertText('\n');
      } else {
        this.insertText(event.key);
      }
      this.canvas.renderCanvas(false, true);
    }
  }

  override onKeyDown(event: KeyboardEvent): void {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      switch (event.key) {
        case 'a':
          if (event.ctrlKey) {
            event.preventDefault();
            this.selectAll();
          }
          break;
        case 'c':
          if (event.ctrlKey) {
            event.preventDefault();
            this.copySelectedRangeToClipboard();
          }
          break;
        case 'v':
          if (event.ctrlKey) {
            event.preventDefault();
            this.pasteClipboardToCurrentTextBox();
          }
          break;
        case 'Delete':
          if (this.#selectedEnd !== null) {
            this.removeSelectedRange();
          } else {
            if (event.ctrlKey) {
              this.#selectedStart = this.#currentTextBox.deleteRange(
                this.#selectedStart,
                this.#currentTextBox.nextWordEndIndex(this.#selectedStart)
              );
            } else {
              this.#selectedStart = this.#currentTextBox.deleteChar(
                this.#selectedStart + 1
              );
            }
          }
          break;
        case 'Backspace':
          event.preventDefault();
          if (this.#selectedEnd !== null) {
            this.removeSelectedRange();
          } else {
            if (event.ctrlKey) {
              this.#selectedStart = this.#currentTextBox.deleteRange(
                this.#currentTextBox.previousWordStartIndex(
                  this.#selectedStart
                ),
                this.#selectedStart
              );
            } else {
              this.#selectedStart = this.#currentTextBox.deleteChar(
                this.#selectedStart
              );
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.moveEditUp(event);
          break;
        case 'ArrowDown':
          event.preventDefault();
          this.moveEditDown(event);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.moveEditLeft(event);
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.moveEditRight(event);
          break;
        case 'Tab':
          event.preventDefault();
          if (this.#selectedEnd !== null) {
            this.removeSelectedRange();
          }
          this.#selectedStart = this.#currentTextBox.insertText(
            '\t',
            this.#selectedStart
          );
          break;
        case 'Home':
          event.preventDefault();
          this.moveEditToLineStart();
          break;
        case 'End':
          event.preventDefault();
          this.moveEditToLineEnd();
          break;
      }
      this.canvas.renderCanvas(false, true);
    }
  }

  override onDoubleClick(_event: MouseEvent): void {
    if (this.#currentTextBox) {
      const index = this.#currentTextBox.indexFromPosition(
        this.canvas.cursor[0],
        this.canvas.cursor[1]
      );
      const range = this.#currentTextBox.lineChunkRangeAtIndex(index);
      if (range[0] == range[1]) {
        this.#selectedStart = range[0];
        this.#selectedEnd = null;
      } else {
        [this.#selectedStart, this.#selectedEnd] =
          this.#currentTextBox.lineChunkRangeAtIndex(index);
      }
      this.canvas.renderCanvas(false, true);
    }
  }

  private insertText(text: string): boolean {
    if (
      this.#currentTextBox &&
      this.#selectedStart !== null &&
      text.length > 0
    ) {
      this.removeSelectedRange();
      this.#selectedStart = this.#currentTextBox.insertText(
        text,
        this.#selectedStart
      );
      return true;
    }
    return false;
  }

  private copySelectedRangeToClipboard() {
    if (
      this.#currentTextBox &&
      this.#selectedStart !== null &&
      this.#selectedEnd !== null
    ) {
      const selectedText = this.#currentTextBox.text.slice(
        Math.min(this.#selectedStart, this.#selectedEnd),
        Math.max(this.#selectedStart, this.#selectedEnd)
      );
      navigator.clipboard.writeText(selectedText);
    }
  }

  private pasteClipboardToCurrentTextBox() {
    navigator.clipboard.readText().then(text => {
      const inserted = this.insertText(text);
      if (inserted) {
        this.canvas.renderCanvas(false, true);
      }
    });
  }

  private moveEditUp(event: KeyboardEvent) {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      if (this.#selectedEnd && this.#selectedEnd > this.#selectedStart) {
        const tmp = this.#selectedStart;
        this.#selectedStart = this.#selectedEnd;
        this.#selectedEnd = tmp;
      }
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      const index = this.#currentTextBox.getAboveIndex(latestIndex);
      if (event.shiftKey) {
        this.setSelectedEnd(index);
      } else {
        this.#selectedStart = index;
        this.#selectedEnd = null;
      }
    }
  }

  private moveEditDown(event: KeyboardEvent) {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      const index = this.#currentTextBox.getBelowIndex(latestIndex);
      if (event.shiftKey) {
        this.setSelectedEnd(index);
      } else {
        this.#selectedStart = index;
        this.#selectedEnd = null;
      }
    }
  }

  private moveEditLeft(event: KeyboardEvent) {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      const index = Math.max(latestIndex - 1, 0);
      if (event.shiftKey) {
        this.setSelectedEnd(index);
      } else if (event.ctrlKey) {
        this.moveEditToPreviousWordStart();
      } else {
        this.#selectedStart = index;
        this.#selectedEnd = null;
      }
    }
  }

  private moveEditRight(event: KeyboardEvent) {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      const index = Math.min(latestIndex + 1, this.#currentTextBox.text.length);
      if (event.shiftKey) {
        this.setSelectedEnd(index);
      } else if (event.ctrlKey) {
        this.moveEditToNextWordEnd();
      } else {
        this.#selectedStart = index;
        this.#selectedEnd = null;
      }
    }
  }

  private moveEditToPreviousWordStart() {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      this.#selectedStart =
        this.#currentTextBox.previousWordStartIndex(latestIndex);
    }
  }

  private moveEditToNextWordEnd() {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      this.#selectedStart = this.#currentTextBox.nextWordEndIndex(latestIndex);
    }
  }

  private moveEditToLineStart() {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      this.#selectedStart = this.#currentTextBox.lineStart(latestIndex);
    }
  }

  private moveEditToLineEnd() {
    if (this.#currentTextBox && this.#selectedStart !== null) {
      const latestIndex: number =
        this.#selectedEnd !== null ? this.#selectedEnd : this.#selectedStart;
      this.#selectedStart = this.#currentTextBox.lineEnd(latestIndex);
    }
  }

  private selectAll() {
    if (this.#currentTextBox) {
      this.#selectedStart = 0;
      this.#selectedEnd = this.#currentTextBox.text.length;
    }
  }
}
