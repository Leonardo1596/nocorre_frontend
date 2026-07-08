package com.nocorre.app.accessibility;

import android.util.Log;
import android.view.accessibility.AccessibilityNodeInfo;

public class AccessibilityNodePrinter {

    private static final String TAG = "NODE_TREE";

    public void traverseNode(AccessibilityNodeInfo node) {
        if (node == null) {
            return;
        }

        traverseNode(node, 0);
    }

    private void traverseNode(AccessibilityNodeInfo node, int depth) {
        if (node == null) {
            return;
        }

        NodeInfo nodeInfo = new NodeInfo(depth, node);
        Log.d(TAG, "Nível " + depth);
        Log.d("NODE_INFO", nodeInfo.toString());

        for (int i = 0; i < node.getChildCount(); i++) {
            traverseNode(node.getChild(i), depth + 1);
        }
    }
}
