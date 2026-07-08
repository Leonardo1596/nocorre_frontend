package com.nocorre.app.accessibility;

import android.graphics.Rect;
import android.view.accessibility.AccessibilityNodeInfo;

public class NodeInfo {
    private final int depth;
    private final CharSequence text;
    private final CharSequence contentDescription;
    private final String viewId;
    private final CharSequence className;
    private final boolean clickable;
    private final boolean visible;
    private final Rect bounds;
    private final int childrenCount;

    public NodeInfo(int depth, AccessibilityNodeInfo node) {
        this.depth = depth;
        this.text = node.getText();
        this.contentDescription = node.getContentDescription();
        this.viewId = node.getViewIdResourceName();
        this.className = node.getClassName();
        this.clickable = node.isClickable();
        this.visible = node.isVisibleToUser();
        this.bounds = new Rect();
        node.getBoundsInScreen(this.bounds);
        this.childrenCount = node.getChildCount();
    }

    @Override
    public String toString() {
        return "NodeInfo{" +
                "depth=" + depth +
                ", text='" + text + '\'' +
                ", contentDescription='" + contentDescription + '\'' +
                ", viewId='" + viewId + '\'' +
                ", className='" + className + '\'' +
                ", clickable=" + clickable +
                ", visible=" + visible +
                ", bounds=" + bounds +
                ", childrenCount=" + childrenCount +
                '}';
    }
}
