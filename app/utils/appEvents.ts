const postMessageToApp = (message: string) => {
  if (global.window && "ReactNativeWebView" in global.window) {
    (global.window as any).ReactNativeWebView.postMessage(message);
    return true;
  }
  return false;
};

export const appGoBack = () => {
  return postMessageToApp("GO_BACK");
};
