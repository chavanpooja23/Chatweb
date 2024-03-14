import React, {useEffect, useState} from 'react'
import { over } from 'stompjs';
import SockJS from 'sockjs-client';
import Picker from 'emoji-picker-react';

var stompClient=null;
const ChatRoom = () => {
  

  const [tab, setTab] = useState("CHATROOM");
  const [publicChats, setPublicChats] = useState([]);
  const [privateChats, setPrivateChats] = useState(new Map());
  const [userData, setUserData] = useState({
        username: "",
        receivername: "",
        connected: false,
        message: ""
    });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
  useEffect(() => {
        console.log(userData);
    }, [userData]);

    useEffect(() => {
        setUserData(prevUserData => ({...prevUserData, "message": ""}));
      }, [tab]);

  const handleUserName = (event) => {
        setUserData({...userData, "username" : event.target.value})
    }
    
  const registerUser = () => {
    if(userData.username !== ""){
        connect();
    }else{
        alert("Please enter a valid user name!"); 
    }
    } 

    const connect = () => {
        let Sock = new SockJS('https://chatserver-qeup.onrender.com/ws');
        stompClient = over(Sock);
        stompClient.connect({}, onConnected, onError);
    }

    const onConnected = () => {
        setUserData({...userData,"connected": true});
        stompClient.subscribe('/chatroom/public', onPublicMessageReceived);
        stompClient.subscribe( '/user/' + userData.username + '/private', onPrivateMessageReceived);
        userJoin();
    }

    const userJoin=()=>{
        var chatMessage = {
          senderName: userData.username,
          status:"JOIN"
        };
        stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
    }

  const onPublicMessageReceived = (payload) => {
        let payloadData=JSON.parse(payload.body);
        switch (payloadData.status) {
            case "JOIN":
                if(!privateChats.get(payloadData.senderName)){
                    privateChats.set(payloadData.senderName,[]);
                    setPrivateChats(new Map(privateChats));
                }
                break;
            case "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats]);
                break;
            default:
                setPublicChats([...publicChats, payloadData]);
                break;
        }
    }

   const onPrivateMessageReceived = (payload) => {
        var payloadData = JSON.parse(payload.body);
        if(privateChats.get(payloadData.senderName)){
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats));
        }else{
            let list =[];
            list.push(payloadData);
            privateChats.set(payloadData.senderName,list);
            setPrivateChats(new Map(privateChats));
        }
        const gridElement = document.getElementById(payloadData.senderName);
        if (gridElement) {
            gridElement.classList.add('received-message');
    }
   }

   const handleMessage= (event) => {
        const {value} = event.target;
        setUserData({...userData, "message" : value});
   }

   const handleEmojiClick = (emojiObject) => {
        const { emoji } = emojiObject;
        const updatedMessage = userData.message + emoji;
        setUserData({...userData , "message": updatedMessage});
        setShowEmojiPicker(true);
   };

   const sendValue = () => {
    if (stompClient) {
        var chatMessage = {
            senderName: userData.username,
            message: userData.message,
            status: "MESSAGE"
        };
        stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
        setUserData({...userData, "message":""});
        setShowEmojiPicker(false);
    }
   }

   const sendPrivateValue=()=>{
        if (stompClient) {
        var chatMessage = {
            senderName: userData.username,
            receiverName:tab,
            message: userData.message,
            status:"MESSAGE"
        };
        
        if(userData.username !== tab){
            privateChats.get(tab).push(chatMessage);
            setPrivateChats(new Map(privateChats));
        }
        stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
        setUserData({...userData,"message": ""});
        setShowEmojiPicker(false);
    }
}
    
  const onError = (error) => {
      console.log(error);
    }


    return (
    <div className='container'>
        {userData.connected  ? 
            <div className='chat-box'>
                <div className='member-list'>
                    <ul>
                        <li onClick={() => {setTab("CHATROOM")}} 
                        className={`member ${tab==="CHATROOM" && "active"}`}>
                            ChatRoom</li>
                            {[...privateChats.keys()].map((name,index) => (
                                <li onClick={() => {setTab(name)}} 
                                className={`member ${tab===name && "active"}`} 
                                key={index}>
                                    {name}
                                    </li>
                            ))}
                    </ul>
                </div>
                {tab==="CHATROOM" && <div className='chat-content'>
                    <ul className='chat-messages'>
                        {publicChats.map((chat,index)=>(
                            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
                                {chat.senderName!==userData.username && <div className='avatar'>{chat.senderName}</div>}
                                <div className='message-data'>{chat.message}</div>
                                {chat.senderName === userData.username && <div className='avatar self'>{chat.senderName}</div>}
                            </li>
                        ))}
                    </ul>

                <div className='send-message'>
                    
                    <button type='button' className='emoji-button' name='message' onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                        
                    <input type='text' className='input-message' name='message' placeholder='Enter the message' value={userData.message} onChange={handleMessage}/>
                
                    {userData.message.trim() !== '' && (
                        <button type='button' className='send-button' onClick={sendValue}>Send</button>
                    )}

                </div>
                <div>
                    {showEmojiPicker && (
                                <Picker onEmojiClick={handleEmojiClick} theme='dark' style={{position: 'absolute', top: '50px'}}/>
                        )}
                </div>

            </div>}
            {tab!=="CHATROOM" && <div className='chat-content'>
                <ul className='chat-messages'>
                    {[...privateChats.get(tab)].map((chat,index) => (
                        <li className={`message ${chat.senderName === userData.username && "self" }`} key={index}>
                            {chat.senderName !== userData.username && <div className='avatar'>{chat.senderName}</div>}
                            <div className='message-data'>{chat.message}</div>
                            {chat.senderName === userData.username && <div className='avatar self'>{chat.senderName}</div>}
                        </li>
                    ))}
                </ul>
                
                <div className='send-message'>
                    
                    <button type='button' className='emoji-button' name='message' onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                        
                    <input type='text' className='input-message' name='message' placeholder='Enter the message' value={userData.message} onChange={handleMessage}/>
                
                    {userData.message.trim() !== '' && (
                        <button type='button' className='send-button' onClick={sendPrivateValue}>Send</button>
                    )}

                </div>
                <div>
                    {showEmojiPicker && (
                            <Picker onEmojiClick={handleEmojiClick} theme='dark' style={{position: 'absolute', top: '50px'}}/>
                        )}
                </div>

                </div>}
        </div>
        :
            <div className='register'>
                <input
                id='user-name'
                placeholder='Enter the user name'
                name='userName'
                value={userData.username}
                onChange={handleUserName}
                margin='normal'/>
                <button type='button' onClick={registerUser}>Connect</button>
            </div>
        }

    </div>
  )
}

export default ChatRoom;
