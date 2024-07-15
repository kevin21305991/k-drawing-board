import { debounce } from './utils';
import gsap from 'gsap';
import '@yaireo/color-picker/dist/styles.css';
import ColorPicker, { any_to_hex } from '@yaireo/color-picker';

class KArtboard {
  constructor(element, options) {
    this.element = document.querySelector(element);
    const defaultOptions = {
      paperCanvasID: 'drawing-paper',
      cursorCanvasID: 'paper-cursor',
      uploadBackgroundSize: 'cover',
    };
    this.params = { ...defaultOptions, ...options };
    this.setting = {
      fillColor: '#ffffff',
      strokeColor: 'transparent',
      brushWidth: 5,
    };
    this.paperWrap = this.element.querySelector('.paper-wrap');
    this.activePaperIndex = 0;
    this.allToolBtn = this.element.querySelectorAll('[data-tool]');
    this.nameDisplay = this.element.querySelector('.name .display');
    this.editBtn = this.element.querySelector('.edit-btn');
    this.uploadInput = this.element.querySelector('.upload-input');
    this.allOptionBtn = this.element.querySelectorAll('.option-btn');
    this.allPaperRadio = this.element.querySelectorAll('.paper-radio input[type="radio"]');
    this.allTabBtn = this.element.querySelectorAll('.tab-nav ul > li');
    this.boardData = [
      {
        paperName: 'Untitled-1',
      },
      {
        paperName: 'Untitled-2',
      },
      {
        paperName: 'Untitled-3',
      },
    ];
    this.#init();
  }

  /**
   * 初始化
   */
  #init() {
    console.log('init');
    this.paperCanvas = new fabric.Canvas('drawing-paper', {
      isDrawingMode: false,
      freeDrawingCursor: 'none',
    });
    this.cursorCanvas = new fabric.StaticCanvas('paper-cursor');
    this.brushCursor = new fabric.Circle({
      left: -100,
      top: -100,
      radius: this.setting.brushWidth * 0.5 + 3,
      fill: 'rgba(255,255,255)',
      opacity: 0.6,
      stroke: 'transparent',
      originX: 'center',
      originY: 'center',
    });

    this.#setCanvasSize();
    this.cursorCanvas.add(this.brushCursor);
    this.#createColorPicker();
    this.#eventListen();
  }

  /**
   * 設定畫布尺寸
   */
  #setCanvasSize() {
    const { clientWidth, clientHeight } = this.paperWrap;
    this.paperCanvas.setWidth(clientWidth);
    this.paperCanvas.setHeight(clientHeight);
    this.cursorCanvas.setWidth(clientWidth);
    this.cursorCanvas.setHeight(clientHeight);
  }

  /**
   * 移動焦點位置
   * @param {object} contentEditableElement 可編輯的元素
   * @param {number} position 欲移動到的焦點位置
   */
  #setCaratTo(contentEditableElement, position) {
    const range = document.createRange();
    range.selectNodeContents(contentEditableElement);

    range.setStart(contentEditableElement.firstChild, position);
    range.setEnd(contentEditableElement.firstChild, position);

    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * 監聽事件
   */
  #eventListen() {
    /**
     * 聚焦畫板名稱
     */
    const focusBoardName = () => {
      const boardName = this.nameDisplay;
      this.#setCaratTo(boardName, boardName.textContent.length);
      boardName.focus();
    };

    /**
     * 編輯畫板名稱
     */
    const editBoardName = () => {
      console.log('edit');
      const newName = this.nameDisplay.textContent;
      const checkedPaperRadio = this.element.querySelector('.paper-radio input[type="radio"]:checked');
      checkedPaperRadio.setAttribute('data-paper', newName);
      this.boardData[this.activePaperIndex] = { ...this.boardData[this.activePaperIndex], ...{ paperName: newName } };
      console.log(this.boardData);
    };

    /**
     * 切換畫紙
     */
    const changePaper = e => {
      const paper = e.target.getAttribute('data-paper');
      this.nameDisplay.textContent = paper;
      this.activePaperIndex = parseInt(e.target.nextElementSibling.textContent) - 1;
    };

    /**
     * 上傳背景圖
     */
    const imageUpload = e => {
      const input = e.target;
      /**
       * 加入背景圖
       * @param {number} paperIndex 圖紙索引
       * @param {string} src 圖片路徑
       */
      const addPaperBackground = src => {
        let x, y;
        const width = this.paperWrap.clientWidth;
        const height = this.paperWrap.clientHeight;
        x = parseInt(getComputedStyle(this.paperWrap).left.replace('px', ''));
        y = parseInt(getComputedStyle(this.paperWrap).top.replace('px', ''));

        this.paperCanvas.clear();
        fabric.Image.fromURL(src, img => {
          let ratio, offset;
          switch (this.params.uploadBackgroundSize) {
            case 'cover':
              //橫式圖 或 1:1圖
              if (img.width >= img.height) {
                ratio = height / img.height;
                offset = (width - img.width * ratio) / 2;
                console.log(ratio);
                x = -x + offset;
                y = 0;
              }
              // //直式圖
              else if (img.width < img.height) {
                ratio = width / img.width;
                offset = (height - img.height * ratio) / 2;
                x = 0;
                y = -y + offset;
              }
              break;
            case 'contain':
              //橫式圖 或 1:1圖
              if (img.width >= img.height) {
                ratio = width / img.width;
                offset = (height - img.height * ratio) / 2;
                y = y + offset;
              }
              // //直式圖
              else if (img.width < img.height) {
                ratio = height / img.height;
                offset = (width - img.width * ratio) / 2;
                x = x + offset;
              }
              break;
          }
          this.paperCanvas.setBackgroundColor(null, this.paperCanvas.renderAll.bind(this.paperCanvas));
          this.paperCanvas.setBackgroundImage(img, this.paperCanvas.renderAll.bind(this.paperCanvas), {
            left: x,
            top: y,
            scaleX: ratio,
            scaleY: ratio,
          });
          this.boardData[this.activePaperIndex] = { ...this.boardData[this.activePaperIndex], ...this.paperCanvas.toJSON() };
          console.log(this.boardData);
        });
      };

      if (input.files && input.files[0]) {
        const reader = new FileReader();
        const img = new Image();
        const _URL = window.URL || window.webkitURL;
        const objectUrl = _URL.createObjectURL(input.files[0]);
        reader.onload = e => {
          img.onload = () => {
            const paperItem = this.element.querySelectorAll('.paper-radio .item')[this.activePaperIndex];
            addPaperBackground(e.target.result);
            paperItem.classList.add('has-background');
            paperItem.querySelector('.img-box').style.background = `url('${e.target.result}') no-repeat center/cover`;
            this.#closeMoreOptions(true);
            _URL.revokeObjectURL(objectUrl);
          };
          img.src = objectUrl;
        };
        reader.readAsDataURL(input.files[0]);
      }
    };

    /**
     * 套用背景色
     */
    const applyBackgroundColor = () => {
      if (parseInt(this.bgColorPicker.color.a) !== 0) {
        const color = this.bgColorPicker.CSSColor;
        const paperItem = this.element.querySelectorAll('.paper-radio .item')[this.activePaperIndex];
        this.paperCanvas.setBackgroundImage(null, this.paperCanvas.renderAll.bind(this.paperCanvas));
        this.paperCanvas.setBackgroundColor(color, this.paperCanvas.renderAll.bind(this.paperCanvas));
        paperItem.classList.add('has-background');
        paperItem.querySelector('.img-box').style.background = color;
        this.boardData[this.activePaperIndex] = { ...this.boardData[this.activePaperIndex], ...this.paperCanvas.toJSON() };
        console.log(this.boardData);
      }
      this.#closeMoreOptions(true);
    };

    /**
     * 移除背景
     */
    const clearBackground = () => {
      const paperItem = this.element.querySelectorAll('.paper-radio .item')[this.activePaperIndex];
      this.paperCanvas.setBackgroundColor(null, this.paperCanvas.renderAll.bind(this.paperCanvas));
      this.paperCanvas.setBackgroundImage(null, this.paperCanvas.renderAll.bind(this.paperCanvas));
      this.bgColorPicker.setColor('rgba(255,255,255,0)');
      paperItem.classList.remove('has-background');
      paperItem.querySelector('.img-box').style.background = '';
      this.#closeMoreOptions(true);
    };

    /**
     *
     * @param {*} e 事件本身
     * @returns
     */
    const boardClickHandler = e => {
      let isTarget = false;
      for (const targetElement of this.allToolBtn) {
        if (targetElement.contains(e.target) || e.target.closest('[data-tool]') === targetElement) {
          isTarget = true;
          break;
        }
      }
      if (!isTarget) {
        this.#closeMoreOptions(true);
        return;
      }
      const toolBtn = e.target.closest('.tool-btn[data-tool]');
      const tool = e.target.closest('[data-tool]').getAttribute('data-tool');
      const hasMoreOptions = toolBtn.querySelector('.more-options');
      this.allToolBtn.forEach(btn => {
        if (btn !== toolBtn) {
          btn.classList.remove('active');
        }
      });
      this.#closeMoreOptions();
      if (hasMoreOptions || tool === 'select' || tool === 'move' || tool === 'text') {
        const isActive = toolBtn.classList.contains('active');
        if (isActive) {
          toolBtn.classList.remove('active');
        } else {
          toolBtn.classList.add('active');
          if (hasMoreOptions) {
            gsap.to(hasMoreOptions, {
              duration: 0.3,
              visibility: 'visible',
              opacity: 1,
            });
          }
        }
      }
    };

    /**
     * 工具選項頁籤
     * @param {*} e 事件本身
     */
    const tabChangeHandler = e => {
      const tabContainer = e.target.closest('.tab-container');
      const tabNav = e.target.closest('.tab-nav');
      const siblingTabBtn = [...tabNav.querySelectorAll('li')];
      const index = siblingTabBtn.indexOf(e.target);
      tabContainer.style.setProperty('--x', index * 100 + '%');
      siblingTabBtn.forEach(btn => {
        btn.classList.remove('active');
      });
      e.target.classList.add('active');
    };

    /**
     * 更換筆刷大小
     * @param {number} size
     */
    const changeBrushSize = size => {
      console.log(size);
    };

    /**
     * 工具選項點擊
     * @param {*} e 事件本身
     */
    const toolOptionClickHandler = e => {
      const targetBtn = e.target.closest('[data-option]');
      const option = targetBtn.getAttribute('data-option');
      if (targetBtn.classList.contains('radio-btn')) {
        const parentGroup = targetBtn.closest('.btn-group');
        parentGroup.querySelectorAll('.radio-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        targetBtn.classList.add('active');
      }
      console.log(option);
      switch (option) {
        case 'clear-bgimage':
        case 'clear-bgcolor':
          clearBackground();
          break;
        case 'apply-bgcolor':
          applyBackgroundColor();
          break;
        case 'brush-size':
          const size = parseInt(targetBtn.getAttribute('value'));
          changeBrushSize(size);
          break;
      }
    };

    this.nameDisplay.addEventListener('input', debounce(editBoardName));
    this.editBtn.addEventListener('click', focusBoardName);
    this.allPaperRadio.forEach(input => {
      input.addEventListener('change', changePaper);
    });
    this.element.addEventListener('click', boardClickHandler);
    this.allOptionBtn.forEach(btn => {
      btn.addEventListener('click', toolOptionClickHandler);
    });
    this.uploadInput.addEventListener('change', imageUpload);
    this.allTabBtn.forEach(tabBtn => {
      tabBtn.addEventListener('click', tabChangeHandler);
    });
    this.element.querySelectorAll('.more-options').forEach(element => {
      element.addEventListener('click', e => e.stopPropagation());
    });
  }

  /**
   * 關閉更多選項
   */
  #closeMoreOptions(closeAll) {
    if (closeAll) {
      this.allToolBtn.forEach(btn => {
        btn.classList.remove('active');
      });
    }
    gsap.to('.more-options', {
      duration: 0.3,
      opacity: 0,
      onComplete: function () {
        const target = this.targets()[0];
        document.querySelectorAll('.more-options').forEach(element => {
          element.style.visibility = 'hidden';
        });
      },
    });
  }

  #createColorPicker() {
    const bgColorPickerContainer = document.querySelector('[data-tool="background"] .cpicker-container');
    this.bgColorPicker = new ColorPicker({
      color: 'rgba(255,255,255,0)',
      swatches: ['#000', '#ADADAD', '#fff', '#ff0000', '#0000ff', '#ffff00'],
      swatchesLocalStorage: true,
      onInput(color) {},
      onChange(color) {
        console.log(color);
      },
      onClickOutside(e) {},
    });
    bgColorPickerContainer.appendChild(this.bgColorPicker.DOM.scope);
  }
}

export default KArtboard;
