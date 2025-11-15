import { usePluginBridge } from "@teable/sdk";
import { useEffect, useState } from "react";

export const useViewId = () =>{ 
  const bridge = usePluginBridge();
  const [viewId, setViewId] = useState<string>();
  useEffect(() => {
    if (!bridge) {
      return;
    }
    bridge.on('syncUrlParams', (params) => {
      setViewId(params.viewId);
    });
  }, [bridge]);

  return viewId;
}