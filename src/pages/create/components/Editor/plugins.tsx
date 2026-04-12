import gemoji from '@bytemd/plugin-gemoji';
import gfm from '@bytemd/plugin-gfm';
import highlight from '@bytemd/plugin-highlight';
import math from '@bytemd/plugin-math';
import type { BytemdPlugin } from 'bytemd';
import 'highlight.js/styles/vs2015.css';
import 'katex/dist/katex.css';
import rehypeCallouts from 'rehype-callouts';
import 'rehype-callouts/theme/obsidian';
import { remarkMark } from 'remark-mark-highlight';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';
import { Modal, Input, message } from 'antd';
import hljs from 'highlight.js/lib/core';
import dos from 'highlight.js/lib/languages/dos';

import videoSvg from './icon/video.svg?raw';
import markerSvg from './icon/marker.svg?raw';
import calloutSvg from './icon/callout.svg?raw';
import noteSvg from './icon/note.svg?raw';
import tipSvg from './icon/tip.svg?raw';
import warningSvg from './icon/warning.svg?raw';
import checkSvg from './icon/check.svg?raw';
import dangerSvg from './icon/danger.svg?raw';
import imageSvg from './icon/image.svg?raw';

// 注册 batch 语言支持
hljs.registerLanguage('batch', dos);
hljs.registerLanguage('bat', dos);
hljs.registerLanguage('cmd', dos);

const rehypeDouyinVideo: Plugin<[], Root, Root> = () => {
  return (tree) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'p') {
        const link = node.children[0];
        if (
          link.type === 'element' &&
          link.tagName === 'a' &&
          link.properties?.href &&
          typeof link.properties.href === 'string'
        ) {
          const match = /(?:ixigua\.com|douyin\.com)\/(\d+)/.exec(link.properties.href);
          if (match) {
            const videoId = match[1];
            const wrapperDiv = {
              type: 'element',
              tagName: 'div',
              properties: {
                className: 'flex justify-center'
              },
              children: [{
                type: 'element',
                tagName: 'iframe',
                properties: {
                  src: `https://open.douyin.com/player/video?vid=${videoId}&autoplay=0`,
                  referrerPolicy: 'unsafe-url',
                  allowFullScreen: true,
                  className: 'douyin'
                },
                children: []
              }]
            };

            Object.assign(node, wrapperDiv);
          }
        }
      }
    });
  };
};

const videos = (): BytemdPlugin => {
  return {
    rehype: (processor) => processor.use(rehypeDouyinVideo as never),
    actions: [
      {
        title: '视频',
        icon: videoSvg,
        handler: {
          type: 'action',
          click: (ctx) => {
            let videoId = '';

            Modal.info({
              title: '插入抖音视频',
              content: (
                <div>
                  <div className="mb-2 text-xs">目前仅支持插入抖音视频</div>
                  <Input placeholder="请输入抖音视频ID" onChange={(e) => videoId = e.target.value.trim()} />
                </div>
              ),
              cancelText: '取消',
              okText: '确认',
              onOk: () => {
                if (!videoId) {
                  message.error('请输入抖音视频ID');
                  return Promise.reject();
                }

                ctx.appendBlock(`[douyin-video](${videoId})`);
              },
              maskClosable: true,
              keyboard: true
            });
          }
        }
      }
    ]
  }
}

const markers = (): BytemdPlugin => {
  return {
    remark: (processor) => processor.use(remarkMark as never),
    actions: [
      {
        title: '标记',
        icon: markerSvg,
        handler: {
          type: 'action',
          click: (ctx) => {
            ctx.wrapText('==', '==');
          }
        }
      }
    ]
  }
}

const callouts = (): BytemdPlugin => {
  const calloutTypes = [
    { title: 'Note', icon: noteSvg, blockType: '[!NOTE]' },
    { title: 'Tip', icon: tipSvg, blockType: '[!TIP]' },
    { title: 'Warning', icon: warningSvg, blockType: '[!WARNING]' },
    { title: 'Check', icon: checkSvg, blockType: '[!CHECK]' },
    { title: 'Danger', icon: dangerSvg, blockType: '[!DANGER]' }
  ];

  return {
    rehype: (processor) => processor.use(rehypeCallouts as never),
    actions: [
      {
        icon: calloutSvg,
        handler: {
          type: 'dropdown',
          actions: calloutTypes.map(({ title, icon, blockType }) => ({
            title,
            icon,
            handler: {
              type: 'action',
              click: (ctx) => {
                ctx.appendBlock(`> ${blockType} ${title}\n> `);
              }
            }
          }))
        }
      }
    ]
  }
}

const material = (): BytemdPlugin => {
  return {
    actions: [
      {
        title: '素材库',
        icon: imageSvg,
        handler: {
          type: 'action',
          click: (ctx) => {
            // 触发图片选择弹窗
            const event = new CustomEvent('openMaterialModal', {
              detail: { ctx }
            });
            window.dispatchEvent(event);
          }
        }
      }
    ]
  }
}

export default [
  videos(),
  gfm({ singleTilde: false }),
  markers(),
  gemoji(),
  math(),
  highlight(),
  callouts(),
  material()
];