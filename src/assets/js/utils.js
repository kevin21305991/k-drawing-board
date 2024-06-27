/**
 * Debounce（去抖動）
 * @param {function} func 欲防止重複執行的 function
 * @param {number} delay 延遲執行的時間(毫秒)
 * @returns
 */
export function debounce(func, delay = 250) {
  let timer = null;
  return function (...args) {
    let context = this;
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

/**
 * Throttle (節閥)
 * @param {*} func 欲防止重複執行的 function
 * @param {*} timeout 設定多少毫秒內只執行一次
 * @returns
 */
export function throttle(func, timeout = 250) {
  let last;
  let timer;
  return function () {
    const context = this;
    const args = arguments;
    const now = +new Date();
    if (last && now < last + timeout) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        last = now;
        func.apply(context, args);
      }, timeout);
    } else {
      last = now;
      func.apply(context, args);
    }
  };
}
