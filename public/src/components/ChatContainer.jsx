import axios from "axios";
import React, { useState, useCallback } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { AiOutlineCheck } from "react-icons/ai";
import { FiUserPlus } from 'react-icons/fi';
import styled from "styled-components";
import ChatInput from "./ChatInput";
import AvatarDefault from "../assets/avatar_default.png"
import { BsCheckLg } from "react-icons/bs";
import { GrClose } from "react-icons/gr";
import {ToastContainer, toast} from 'react-toastify'
import { FileIcon, defaultStyles } from 'react-file-icon';

import { acceptAddFriend, addSentInvitation, denyAddFriend, getAllMessagesRoute, sendMessageRoute } from "../utils/APIRoutes";
import { uploadToS3 } from "../utils/AWS";
import ViewFiles from "./ViewFiles";

function ChatContainer({arrivalMessage, updateListConversation, currentChat, currentUser, setCurrentUser, socket, openImageViewer,files}) {
    const [messages, setMessages] = useState([]);
    const [sentInvitation, setSentInvitation] = useState(false);
    const [haveInvitation, setHaveInvitation] = useState(false);
    const [isFriend, setIsFriend] = useState(false);
    const [isSingle, setIsSingle] = useState(true);
    

    const toastOptions = {
        position: 'bottom-right',
        autoClose: 8000,
        draggable: true,
        pauseOnHover: true,
        theme: "dark"
    };

    const scrollRef = useRef();
    useEffect(() => {
        getAllMessagesFromDB();
        if (currentChat && currentChat.conversation.members.length === 2) {
            setIsSingle(true);
        }
    }, [currentChat])
    
    const getAllMessagesFromDB = async () => {
        if (currentChat) {

            const response = await axios.post(`${getAllMessagesRoute}`, {
                userId: currentUser._id,
                conversationId: currentChat.conversation._id
            })
            console.log(response.data);
            setMessages(response.data);
        }
    }
    
    const handleSendMsg = async (msg) => {
        const newMessage = await axios.post(sendMessageRoute, {
            from: currentUser._id,
            conversationId: currentChat.conversation._id,
            message:msg
        })
        socket.current.emit("send-msg", {
            from: {userId: currentUser._id, conversationId: currentChat.conversation._id},
            to: currentChat.conversation.members,
            message: newMessage.data
        })
        console.log(newMessage.data);
        const msgs = [...messages];
        msgs.push({fromSelf: true, message: newMessage.data });
        setMessages(msgs);
        updateListConversation(new Date())
    };

    const handleFileUpload = async (e) => {
        const { files } = e.target;
        if (files && files.length) {
            // const filename = files[0].name;
            // console.log("fileName", files);
            // var parts = filename.split(".");
            // const fileType = parts[parts.length - 1];
            // console.log("fileType", fileType); //ex: zip, rar, jpg, svg etc.
            //  await axios.post(`${sendImagesRoute}`, {files})
            // setImages(files);
            // socket.current.emit("send-msg", {
            //     from: {userId: currentUser._id, conversationId: currentChat.conversation._id},
            //     to: currentChat.conversation.members,
            //     message: files
            // })
            const response = await uploadToS3(files);
            if (response.status) {
                const newConversation = await axios.post(sendMessageRoute, {
                    from: currentUser._id,
                    conversationId: currentChat.conversation._id,
                    files: response.files
                })
                
                socket.current.emit("send-msg", {
                    from: {userId: currentUser._id, conversationId: currentChat.conversation._id},
                    to: currentChat.conversation.members,
                    message: newConversation.data
                })

                const msgs = [...messages];
                msgs.push({fromSelf: true, message: newConversation.data});
                setMessages(msgs);
                updateListConversation(new Date())
            } else {
                toast.error(response.message, toastOptions);
            }
        }
    }
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes'
    
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    
        const i = Math.floor(Math.log(bytes) / Math.log(k))
    
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }
    useEffect(() => {
        if (socket.current) {
            socket.current.on("response-deny-invitation", (data) => {
                if (data.from._id === currentChat.users_info[0]._id) {
                    // setCurrentChat(data.from);
                    setSentInvitation(false)
                }
            })
            socket.current.on("response-accept-friend", async (data) => {
                // console.log(data);
                if (data.to === currentUser._id) {
                    setIsFriend(true);
                    currentUser.listFriends = [currentUser.listFriends, data.from]
                    if (currentUser && currentUser.sentInvitations) {
                        currentUser.sentInvitations.map((invitation, index) => {
                            if (invitation === currentChat.users_info._id) {
                                currentUser.sentInvitations.splice(index, 1);
                            }
                        })
                    }
                    console.log("currentUser", currentUser);
                    localStorage.setItem("chat-app-user", JSON.stringify(currentUser));
                    setCurrentUser(await JSON.parse(localStorage.getItem("chat-app-user")));
                }
            })
            
        }
        
    });
    useEffect(() => { 
        arrivalMessage && setMessages(prev => [...prev, arrivalMessage])
    }, [arrivalMessage])
    useEffect(() => {
        scrollRef.current?.scrollIntoView({behaviour: "smooth"})
    }, [messages])
    useEffect(() => {
        if (currentUser && currentUser.listFriends && currentChat.conversation.members.length === 2)
            if (currentUser.listFriends.length === 0)
                setIsFriend(false);
            else {
                currentUser.listFriends.map((friend, index) => {
                    if (friend === currentChat.users_info[0]._id) {
                        setIsFriend(true);
                    } else {
                        if (index === currentUser.listFriends.length - 1) {
                            setIsFriend(false);
                        }
                    }
                })
            }
    }, [currentChat]);
    const onHandleAddFriend = async () => {
        await axios.post(`${addSentInvitation}`, {
            from: currentUser._id,
            to: currentChat.users_info[0]._id
        });
        socket.current.emit("send-invitation", {
            from: currentUser._id,
            to: currentChat.users_info[0]._id
        });
        setSentInvitation(true);
    }

    useEffect(() => {
        if (currentChat && currentChat.users_info.length === 2 && currentUser && currentChat && currentChat.sentInvitations) {
            currentChat.users_info[0].sentInvitations.map((invitation) => {
                if (currentUser._id === invitation) {
                    setSentInvitation(true);
                }
            })
        }
    });
    useEffect(() => {
        if (currentUser && currentChat && currentUser.sentInvitations) {
            currentUser.sentInvitations.map((invitation) => {
                if ( currentChat.users_info.length === 1  && currentChat.users_info[0]._id === invitation) {
                    setHaveInvitation(true);
                }
            })
        }
    }, [currentUser]);
    const onHandAcceptFriend = async () => {
        currentUser.listFriends = [...currentUser.listFriends, currentChat.users_info[0]._id];
        await axios.post(`${acceptAddFriend}`, {
            currentUser: currentUser,
            currentChat: currentChat.users_info[0]
        });
        socket.current.emit("acceptted", {
            from: currentUser._id,
            to: currentChat.users_info[0]._id
        });
        if (currentUser && currentUser.sentInvitations) {
            currentUser.sentInvitations.map((invitation, index) => {
                if (invitation === currentChat.users_info[0]._id) {
                    currentUser.sentInvitations.splice(index, 1);
                }
            })
        }
        localStorage.setItem("chat-app-user", JSON.stringify(currentUser));
        setCurrentUser(await JSON.parse(localStorage.getItem("chat-app-user")));
        setIsFriend(true);
        setHaveInvitation(false);
    }

    const onHandleDeny = async () => {
        if (currentUser && currentUser.sentInvitations) {
            currentUser.sentInvitations.map((invitation, index) => {
                if (invitation === currentChat.users_info[0]._id) {
                    currentUser.sentInvitations.splice(index, 1);
                }
            })
        }
        await axios.post(`${denyAddFriend}`, {
            from: currentUser._id,
            to: currentChat.users_info[0]._id
        })
        socket.current.emit("denyAddFriend", {
            from: currentUser,
            to: currentChat.users_info[0]
        });
        localStorage.setItem("chat-app-user", JSON.stringify(currentUser));
        setCurrentUser(await JSON.parse(localStorage.getItem("chat-app-user")));
        setHaveInvitation(false);
    }
    return (
    <>
        {currentChat && currentUser && (<Container>
            <div className="chat-header">
                <div className="user-details">
                    <div className="avatar">
                        {currentChat.avatarImage && currentChat.avatarImage != "" ? 
                            <img src={`data:image/svg+xml;base64,${currentChat.avatarImage}`} alt="avatar"/>
                            : <img src={AvatarDefault} alt="avatar"/>
                        }
                    </div>
                    <div className="username">
                        <h3>{currentChat.conversation.members.length > 2 ? currentChat.conversation.name : currentChat.users_info[0].username}</h3>
                    </div>
                </div>
            </div>
            {isSingle && (haveInvitation ? 
                (
                    <div className="haveInvitation">
                        <div className="title-invitation">You have an invitation</div>
                        <div className="btn-response-invitation">
                            <div className="accept" onClick={() => onHandAcceptFriend()}>
                                <BsCheckLg /> <p className="accept-text">Accept</p>
                            </div>
                            <div className="deny" onClick={() => onHandleDeny()}>
                                <GrClose /> <p className="deny-text">Deny</p>
                            </div>
                        </div>
                    </div>
                )
                : (!sentInvitation ? 
                (!isFriend ? 
                    <div className="addFriend" onClick={() => onHandleAddFriend()}>
                        <FiUserPlus /> <p className="add-text">Add friend</p>
                    </div> : <div></div>) : 
                    (!isFriend ?  <div className="sentInvitation">
                        <AiOutlineCheck /> <p className="sent-text">Sent invitation</p>
                    </div> : <div></div>)))
                    }
            <div className="chat-messages">
                {
                    messages && messages.map((message, index) => {
                        // console.log(message);
                        return (<div ref={scrollRef} key={index}>
                            <div className={`message ${message.fromSelf ? 'sended' : 'received'}`}>
                                <div className="content">
                                    <div className="files">
                                        {message.message.message.files && message.message.message.files.length > 0 && 
                                        message.message.message.files.map((file,index) => 
                                        {
                                            var parts = file.url.split(".");
                                            const fileType = parts[parts.length - 1];
                                            if (fileType === "jpg" || fileType === "jpeg" || fileType === "png") {
                                                return <div className="img-container">
                                                        <img onClick={ () => openImageViewer(index, message.message.message.files) } key={index} src={file.url} />
                                                    </div>
                                            }
                                            else if (fileType === "docx") {
                                                return <div className="file-container" onClick={ () => openImageViewer(index, message.message.message.files) }>
                                                    <FileIcon extension={`${fileType}`}  {...defaultStyles.docx}  />
                                                    <div className="file-info">
                                                        <p>{file.fileName}</p>
                                                        <p className="file-size">{formatBytes(file.size,2)}</p>
                                                    </div>
                                                </div>
                                                // return <FileIcon extension="asv" {...defaultStyles}  />
                                            }
                                            else if (fileType === "pdf") {
                                                return <div className="file-container" onClick={ () => openImageViewer(index, message.message.message.files) }>
                                                    <FileIcon extension={`${fileType}`}  {...defaultStyles.pdf}  />
                                                    <div className="file-info">
                                                        <p>{file.fileName}</p>
                                                        <p className="file-size">{formatBytes(file.size,2)}</p>
                                                    </div>
                                                </div>
                                                // return <FileIcon extension="asv" {...defaultStyles}  />
                                            } else {
                                                return <div className="file-container" onClick={ () => openImageViewer(index, message.message.message.files) }>
                                                    <FileIcon extension={`${fileType}`}  {...defaultStyles}  />
                                                    <div className="file-info">
                                                        <p>{file.fileName}</p>
                                                        <p className="file-size">{formatBytes(file.size,2)}</p>
                                                    </div>
                                                </div>
                                            }
                                        }) 
                                    }
                                    </div>
                                    <p>{message.message.message.text}</p>
                                </div>
                            </div>
                        </div>);
                    })
                }
            </div>
            <ChatInput handleSendMsg={handleSendMsg} handleFileUpload={handleFileUpload} images={files} />
            <ToastContainer />
        </Container>)}
    </>
    );
}

const Container = styled.div`
    display: flex;
    position: relative;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    gap: 0.1rem;
    overflow: hidden;
    /* @media screen and (min-width: 720px) and (max-width: 1080px){
        grid-auto-rows: 15% 70% 15%;
    } */
    .chat-header {
        display: flex;
        flex: 1;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background-color: #0d0d30;
        .user-details {
            display: flex;
            align-items: center;
            gap: 1rem;
            .avatar {
                img {
                    height: 3rem;
                }
            }
            .username {
                h3 {
                    color: white;
                }
            }
        }    
    }
    .addFriend {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        background-color: #9186f3;
        cursor: pointer;
        .add-text {
            margin-left: 0.5rem;
        }

    }  
    .sentInvitation {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #000;
        background-color: #ccc;
        .sent-text {
            margin-left: 0.5rem;
        }
    } 
    .haveInvitation {
        flex: 1;
        display: grid;
        grid-template-rows: 50% 50%;
        background-color: #16151584;
        overflow: hidden;
        .title-invitation {
            color: #fff;
            text-align: center;
            padding: 0.3rem 0;
        }
        .btn-response-invitation {
            width: 100%;
            display: grid;
            grid-template-columns: 50% 50%;
            .accept {
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #5fb85f;
                padding: 0.3rem 0;
                cursor: pointer;
            }
            .deny {
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #ccc;
                padding: 0.3rem 0;
                cursor: pointer;
            }
        }

    }
    .chat-messages {
        flex: 12;
        padding: 1rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow: auto;
        &::-webkit-scrollbar {
            width: 0.2rem;
            &-thumb {
                background-color: #ffffff39;
                width: 0.1rem;
                border-radius: 1rem;
            }
        }
        .message {
            display: flex;
            align-items: center;
            .content {
                max-width: 50%;
                overflow-wrap: break-word;
                padding: 1rem;
                font-size: 1.1rem;
                border-radius: 1rem;
                color: #d1d1d1;
                .files {
                  display: flex;
                  width: 100%;
                  justify-content: center;
                  flex-direction: row;
                  flex-wrap: wrap;
                  gap: 0.5rem;
                  .img-container {
                      height: 40vh;
                      flex-grow: 1;
                      img {
                        max-height: 100%;
                        min-width: 100%;
                        object-fit: contain;
                        vertical-align: bottom;
                        &:hover {
                            opacity: 0.5;
                            cursor: pointer;
                        }
                    }
                  }
                  .file-container {
                    width: 100%;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 0.5rem;
                    svg {
                        width: 5vw;
                        height: 8vh;
                    }
                    .file-info {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                        .file-size {
                            font-size: 0.8rem;
                        }
                    }
                  }
                }
            }
        }
        .sended {
            justify-content: flex-end;
            .content {
                background-color: #4f04ff21;
            }
        }
        .received {
            justify-content: flex-start;
            .content {
                background-color: #9900ff20;
            }
        }
    }
    .view-files-container {
        position: absolute;
        width: 100vw;
        height: 100vh;
        top: 0;
        left: 0;
        z-index: 1;
    }
    .view-files-container-disable {
        display: none;
    }
`;

export default ChatContainer;