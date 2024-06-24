import '../css/style.sass';

const editBtn = document.querySelector('.edit-btn');

/**
 * 移動焦點位置
 * @param {object} contentEditableElement 可編輯的元素
 * @param {number} position 欲移動到的焦點位置
 */
function setCaratTo(contentEditableElement, position) {
  const range = document.createRange();
  range.selectNodeContents(contentEditableElement);

  range.setStart(contentEditableElement.firstChild, position);
  range.setEnd(contentEditableElement.firstChild, position);

  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * 編輯畫板名字
 */
function editBoardName() {
  const boardName = document.querySelector('.name .display');
  setCaratTo(boardName, boardName.textContent.length);
  boardName.focus();
}

const canvas = new fabric.Canvas('paper1');

editBtn.addEventListener('click', editBoardName);
