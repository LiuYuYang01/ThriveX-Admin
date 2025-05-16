import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button, Card, Dropdown, Image, Input, message, Modal, Spin } from "antd"
import TextArea from "antd/es/input/TextArea"

import { addRecordDataAPI, editRecordDataAPI, getRecordDataAPI } from '@/api/Record'

import Title from "@/components/Title"
import { titleSty } from "@/styles/sty"

import { BiLogoTelegram } from "react-icons/bi";
import { LuImagePlus } from "react-icons/lu";
import { RiDeleteBinLine } from "react-icons/ri";
import Material from "@/components/Material";

export default () => {
    const [loading, setLoading] = useState(false)

    const [params] = useSearchParams()
    const id = +params.get('id')!
    const navigate = useNavigate()

    const [content, setContent] = useState("")
    const [imageList, setImageList] = useState<string[]>([])

    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

    // 删除图片
    const handleDelImage = (data: string) => {
        setImageList(imageList.filter(item => item != data))
    }

    const onSubmit = async () => {
        try {
            setLoading(true)

            const data = {
                content,
                images: JSON.stringify(imageList),
                createTime: new Date().getTime().toString()
            }

            if (!content.trim().length) {
                message.error("请输入内容")
                return
            }

            if (id) {
                await editRecordDataAPI({ id, content: data.content, images: data.images })
                message.success("编辑闪念成功")
            } else {
                await addRecordDataAPI(data)
                message.success("发布闪念成功")
            }

            setLoading(false)
            navigate("/record")
        } catch (error) {
            setLoading(false)
        }
    }

    const getRecordData = async () => {
        try {
            setLoading(true)

            const { data } = await getRecordDataAPI(id)
            setContent(data.content)
            setImageList(JSON.parse(data.images as string))

            setLoading(false)
        } catch (error) {
            setLoading(false)
        }
    }

    // 回显数据
    useEffect(() => {
        // 有Id就回显指定的数据
        if (id) getRecordData()
    }, [id])

    // 添加下拉菜单项配置
    const dropdownItems = {
        items: [
            {
                key: 'upload',
                label: '选择图片',
                onClick: () => {
                    if (imageList.length >= 4) {
                        message.warning('最多只能上传 4 张图片');
                        return;
                    }
                    
                    setIsMaterialModalOpen(true);
                }
            },
            {
                key: 'input',
                label: '输入链接',
                onClick: () => {
                    if (imageList.length >= 4) {
                        message.warning('最多只能上传 4 张图片');
                        return;
                    }

                    let inputUrl = '';

                    Modal.info({
                        title: '输入图片链接',
                        content: (
                            <Input
                                className="mt-2"
                                placeholder="请输入图片链接"
                                onChange={(e) => {
                                    inputUrl = e.target.value;
                                }}
                            />
                        ),
                        okText: '添加',
                        cancelText: '取消',
                        maskClosable: true,
                        onOk: () => {
                            if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
                                message.error('链接必须以 http:// 或 https:// 开头');
                                return Promise.reject();
                            }

                            setImageList([...imageList, inputUrl]);
                            return Promise.resolve();
                        }
                    });
                }
            }
        ]
    };

    return (
        <div>
            <Title value="闪念" />

            <Spin spinning={loading}>
                <Card className={`${titleSty} min-h-[calc(100vh-180px)]`}>
                    <div className="relative flex w-[90%] xl:w-[800px] mx-auto mt-[50px]">
                        <TextArea
                            rows={10}
                            maxLength={500}
                            placeholder="记录此刻！"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full p-4 border-2 border-[#eee] dark:bg-boxdark-2 dark:border-transparent text-base rounded-md"
                        />

                        <div className="absolute bottom-4 left-4 flex items-end space-x-3 max-w-[calc(100%-80px)]">
                            <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                                {imageList.length > 0 && imageList.map((item, index) => (
                                    <div key={index} className="group overflow-hidden relative shrink-0">
                                        <div className="absolute top-0 -right-6 group-hover:right-0 z-10 bg-slate-600 rounded-full cursor-pointer p-1" onClick={() => handleDelImage(item)}>
                                            <RiDeleteBinLine className="text-white" />
                                        </div>

                                        <Image
                                            key={index}
                                            src={item}
                                            preview={false}
                                            className='rounded-lg md:!w-[100px] md:!h-[100px] xs:!w-20 xs:!h-20 !w-15 !h-15 object-cover'
                                        />
                                    </div>
                                ))}
                            </div>

                            <Dropdown menu={dropdownItems} placement="top">
                                <LuImagePlus className="mb-1 text-3xl md:text-4xl text-slate-700 dark:text-white hover:text-primary dark:hover:text-primary cursor-pointer shrink-0" />
                            </Dropdown>
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            icon={<BiLogoTelegram className="text-xl" />}
                            loading={loading}
                            className="absolute bottom-4 right-4"
                            onClick={onSubmit}
                        />
                    </div>
                </Card>
            </Spin>

            <Material
                maxCount={4 - imageList.length}
                open={isMaterialModalOpen}
                onClose={() => setIsMaterialModalOpen(false)}
                onSelect={(url) => {
                    setImageList([...imageList, ...url]);
                }}
            />
        </div>
    )
}