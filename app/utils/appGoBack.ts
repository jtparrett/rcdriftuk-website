export const appGoBack = () => {
  if (global.window && "ReactNativeWebView" in global.window) {
    (global.window as any).ReactNativeWebView.postMessage("GO_BACK");
    return true;
  }

  return false;
};
