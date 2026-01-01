import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../firebase';
import { collection, query, where, getDocs, setDoc, doc, updateDoc, serverTimestamp, getDoc, onSnapshot, limit, deleteField, arrayUnion, increment } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { updateProfile } from 'firebase/auth';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [searchedUser, setSearchedUser] = useState(null);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [err, setErr] = useState(null);
    const [openEmoji, setOpenEmoji] = useState(false);
    const [img, setImg] = useState(null);
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                navigate("/login");
            }
        });
        return () => unsubAuth();
    }, [navigate]);

    useEffect(() => {
        if (!currentUser) return;

        // Listener for current user's chats
        const unsubChats = onSnapshot(doc(db, "userChats", currentUser.uid), (doc) => {
            setChats(doc.data() || {});
        });

        // Listener for suggested users (Real-time)
        const usersRef = collection(db, "users");
        const q = query(usersRef, limit(10));

        const unsubUsers = onSnapshot(q, (querySnapshot) => {
            const users = [];
            querySnapshot.forEach((doc) => {
                if (doc.data().uid !== currentUser.uid) {
                    users.push(doc.data());
                }
            });
            setSuggestedUsers(users);
        }, (error) => {
            console.error("Error fetching suggestions:", error);
        });

        return () => {
            unsubChats();
            unsubUsers();
        };
    }, [currentUser]);


    // Listen for messages when a chat is selected
    useEffect(() => {
        if (!selectedChat) return;
        const unSub = onSnapshot(doc(db, "chats", selectedChat.chatId), (doc) => {
            doc.exists() && setMessages(doc.data().messages);
        });
        return () => unSub();
    }, [selectedChat])

    const handleSearch = async () => {
        setErr(null);
        const searchQuery = username.toLowerCase().trim();
        console.log("Starting search for:", searchQuery);

        try {
            // Client-side search for flexibility (case-insensitive)
            const querySnapshot = await getDocs(query(collection(db, "users")));
            console.log("Total users fetched:", querySnapshot.size);
            let found = false;

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                console.log("Comparing with:", userData.email);
                if (userData.email && userData.email.toLowerCase() === searchQuery) {
                    setSearchedUser(userData);
                    setErr(null);
                    found = true;
                }
            });

            if (!found) {
                console.log("No match found.");
                setErr("User not found!");
                setSearchedUser(null);
            }

        } catch (err) {
            console.error("Search error:", err);
            setErr(err.message);
        }
    };

    const handleKey = (e) => {
        e.code === "Enter" && handleSearch();
    };

    const handleSelectUser = async (userToSelect) => {
        const targetUser = userToSelect || searchedUser;
        if (!targetUser) return;

        const combinedId =
            currentUser.uid > targetUser.uid
                ? currentUser.uid + targetUser.uid
                : targetUser.uid + currentUser.uid;

        try {
            const res = await getDoc(doc(db, "chats", combinedId));

            if (!res.exists()) {
                // create a chat in chats collection
                await setDoc(doc(db, "chats", combinedId), { messages: [] });

                // create user chats in userChats collection
                await updateDoc(doc(db, "userChats", currentUser.uid), {
                    [combinedId + ".userInfo"]: {
                        uid: targetUser.uid,
                        displayName: targetUser.displayName,
                        photoURL: targetUser.photoURL,
                    },
                    [combinedId + ".date"]: serverTimestamp(),
                });

                await updateDoc(doc(db, "userChats", targetUser.uid), {
                    [combinedId + ".userInfo"]: {
                        uid: currentUser.uid,
                        displayName: currentUser.displayName,
                        photoURL: currentUser.photoURL,
                    },
                    [combinedId + ".date"]: serverTimestamp(),
                });
            } else {
                // If chat exists but not in current user's list (e.g., deleted), restore it
                const chatData = chats[combinedId];
                if (!chatData) {
                    await updateDoc(doc(db, "userChats", currentUser.uid), {
                        [combinedId + ".userInfo"]: {
                            uid: targetUser.uid,
                            displayName: targetUser.displayName,
                            photoURL: targetUser.photoURL,
                        },
                        [combinedId + ".date"]: serverTimestamp(),
                        [combinedId + ".unreadCount"]: 0 // Start fresh
                    });
                } else {
                    // Chat exists and is in list, just reset count
                    await updateDoc(doc(db, "userChats", currentUser.uid), {
                        [combinedId + ".unreadCount"]: 0
                    });
                }
            }

            setUser(targetUser);
            setSearchedUser(null);
            setUsername("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleEmoji = (e) => {
        setNewMessage((prev) => prev + e.emoji);
        setOpenEmoji(false);
    };

    const handleImg = (e) => {
        if (e.target.files[0]) {
            setImg(e.target.files[0]);
        }
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !img) || !selectedChat) return;

        const combinedId = selectedChat.chatId;

        const messageData = {
            id: crypto.randomUUID(),
            text: newMessage,
            senderId: currentUser.uid,
            date: new Date(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        try {
            if (img) {
                const storageRef = ref(storage, crypto.randomUUID());
                const uploadTask = uploadBytesResumable(storageRef, img);

                uploadTask.on(
                    "state_changed",
                    null,
                    (error) => {
                        console.error(error);
                        // setErr(true);
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                            await updateDoc(doc(db, "chats", combinedId), {
                                messages: arrayUnion({ ...messageData, img: downloadURL })
                            });
                            const lastMessage = { text: "📷 Image" };
                            await updateLastMessage(combinedId, lastMessage);
                        });
                    }
                );
            } else {
                await updateDoc(doc(db, "chats", combinedId), {
                    messages: arrayUnion(messageData)
                });
                await updateLastMessage(combinedId, { text: newMessage });
            }

            setNewMessage("");
            setImg(null);
            setOpenEmoji(false);
        } catch (err) {
            console.error(err);
        }
    };

    // Helper to update last message for both users
    const updateLastMessage = async (combinedId, lastMsg) => {
        // Update Sender
        await updateDoc(doc(db, "userChats", currentUser.uid), {
            [combinedId + ".lastMessage"]: lastMsg,
            [combinedId + ".date"]: serverTimestamp(),
        });

        // Update Receiver (Increment unread count)
        await updateDoc(doc(db, "userChats", selectedChat.user.uid), {
            [combinedId + ".lastMessage"]: lastMsg,
            [combinedId + ".date"]: serverTimestamp(),
            [combinedId + ".unreadCount"]: increment(1)
        });
    }

    const handleChatSelect = async (u) => {
        const combinedId = currentUser.uid > u.uid ? currentUser.uid + u.uid : u.uid + currentUser.uid;

        // Reset unread count
        try {
            // We use dot notation to update nested field
            const chatRef = doc(db, "userChats", currentUser.uid);
            // We need to check if we can update just that field.
            await updateDoc(chatRef, {
                [combinedId + ".unreadCount"]: 0
            });
        } catch (err) {
            console.error("Error resetting unread count:", err);
        }

        setSelectedChat({ chatId: combinedId, user: u });
    }

    const [editingProfile, setEditingProfile] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newPhoto, setNewPhoto] = useState(null);

    // ... existing functions ...

    const handleDeleteChat = async (chatId, e) => {
        e.stopPropagation(); // Prevent selecting the chat
        try {
            await updateDoc(doc(db, "userChats", currentUser.uid), {
                [chatId]: deleteField()
            });
            if (selectedChat?.chatId === chatId) {
                setSelectedChat(null);
            }
        } catch (err) {
            console.error("Error deleting chat:", err);
        }
    };

    const handleUpdateProfile = async () => {
        if (!newDisplayName && !newPhoto) {
            setEditingProfile(false);
            return;
        }

        try {
            let photoURL = currentUser.photoURL;
            if (newPhoto) {
                const storageRef = ref(storage, currentUser.uid + "_avatar");
                const uploadTask = await uploadBytesResumable(storageRef, newPhoto);
                photoURL = await getDownloadURL(uploadTask.ref);
            }

            if (newDisplayName || newPhoto) {
                await updateProfile(auth.currentUser, {
                    displayName: newDisplayName || currentUser.displayName,
                    photoURL: photoURL
                });

                // Update firestore user doc
                await updateDoc(doc(db, "users", currentUser.uid), {
                    displayName: newDisplayName || currentUser.displayName,
                    photoURL: photoURL
                });

                // Force local state update if needed, but onAuthStateChanged might handle it? 
                // Creating a shallow login refresh trick might be needed or just rely on Firebase.
                // We'll reload the window to be sure for simplicity or just update local state.
                setCurrentUser({ ...currentUser, displayName: newDisplayName || currentUser.displayName, photoURL });
            }

            setEditingProfile(false);
            setNewPhoto(null);
            setNewDisplayName('');
        } catch (err) {
            console.error("Profile update error:", err);
            setErr("Failed to update profile: " + err.message);
        }
    };

    const handleLogout = () => {
        signOut(auth);
        navigate("/login");
    }

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar glass-panel">
                <div className="sidebar-header">
                    <h3 className="gradient-text">ChatVerse</h3>
                    <div className="user-profile">
                        <img src={currentUser?.photoURL} alt="" />
                        <span>{currentUser?.displayName}</span>
                        <button onClick={() => setEditingProfile(true)} className='btn-icon' title="Edit Profile" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '5px' }}>✏️</button>
                        <button onClick={handleLogout} className='btn-logout'>Logout</button>
                    </div>
                </div>

                {editingProfile && (
                    <div className="edit-profile-modal glass-panel" style={{ margin: '15px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', border: 'none', zIndex: 100 }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Edit Profile</h4>
                        <input type="text" placeholder="New Display Name" value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid var(--border-color)', outline: 'none' }} />
                        <input type="file" onChange={e => setNewPhoto(e.target.files[0])} style={{ fontSize: '0.9rem' }} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                            <button onClick={handleUpdateProfile} className='btn-primary' style={{ flex: 1 }}>Save</button>
                            <button onClick={() => setEditingProfile(false)} style={{ padding: '8px 15px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '5px', cursor: 'pointer', flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                )}

                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Find a user by email..."
                        onKeyDown={handleKey}
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                    />
                    {err && <span style={{ color: 'red', fontSize: '12px' }}>{err}</span>}
                    {searchedUser && (
                        <div className="user-chat-item" onClick={() => handleSelectUser(searchedUser)}>
                            <img src={searchedUser.photoURL} alt="" />
                            <div className="user-chat-info">
                                <span>{searchedUser.displayName}</span>
                            </div>
                        </div>
                    )}
                    {!username && !searchedUser && suggestedUsers.length > 0 && (
                        <div className="suggested-users">
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '10px 0' }}>Suggested Users</h4>
                            {suggestedUsers.map(u => (
                                <div className="user-chat-item" key={u.uid} onClick={() => handleSelectUser(u)}>
                                    <img src={u.photoURL} alt="" />
                                    <div className="user-chat-info">
                                        <span>{u.displayName}</span>
                                        <p style={{ fontSize: '0.75rem' }}>Click to chat</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="chats-list">
                    {Object.entries(chats)?.sort((a, b) => b[1].date - a[1].date).map((chat) => (
                        <div
                            className={`user-chat-item ${selectedChat?.chatId === chat[0] ? 'active' : ''}`}
                            key={chat[0]}
                            onClick={() => handleChatSelect(chat[1].userInfo)}
                            style={{ position: 'relative' }}
                        >
                            <img src={chat[1].userInfo.photoURL} alt="" />
                            <div className="user-chat-info">
                                <span>{chat[1].userInfo.displayName}</span>
                                <p>{chat[1].lastMessage?.text}</p>
                            </div>
                            {chat[1].unreadCount > 0 && (
                                <div style={{
                                    background: '#25D366',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    marginRight: '35px'
                                }}>
                                    {chat[1].unreadCount}
                                </div>
                            )}
                            <span
                                onClick={(e) => handleDeleteChat(chat[0], e)}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#ff4b4b', cursor: 'pointer', fontSize: '1.5rem', padding: '5px', zIndex: 10, opacity: 0.7, fontWeight: 'bold' }}
                                title="Delete Chat"
                                className="delete-chat-btn"
                            >
                                ×
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-area glass-panel">
                {selectedChat ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-target-info">
                                <img src={selectedChat.user.photoURL} alt="" />
                                <span>{selectedChat.user.displayName}</span>
                            </div>
                            <div className="chat-actions">
                                {/* Could put video/call icons here */}
                            </div>
                        </div>
                        <div className="messages-container">
                            {messages.map((m) => (
                                <div className={`message ${m.senderId === currentUser.uid ? 'owner' : ''}`} key={m.id}>
                                    <div className="message-content">
                                        {m.img && <img src={m.img} alt="" style={{ width: '100%', borderRadius: '10px', marginBottom: '5px' }} />}
                                        <p>{m.text}</p>
                                        {/* <span>{m.timestamp}</span> */}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="input-area">
                            {openEmoji && (
                                <div className="emoji-picker-wrapper">
                                    <EmojiPicker onEmojiClick={handleEmoji} />
                                </div>
                            )}
                            <div className="input-icons">
                                <span onClick={() => setOpenEmoji(!openEmoji)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>😃</span>
                                <label htmlFor="file-upload" style={{ cursor: 'pointer', fontSize: '1.2rem', marginLeft: '10px' }}>
                                    📎
                                </label>
                                <input
                                    type="file"
                                    id="file-upload"
                                    style={{ display: 'none' }}
                                    onChange={handleImg}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder={img ? "Image selected. Type a caption or send..." : "Type something..."}
                                onChange={(e) => setNewMessage(e.target.value)}
                                value={newMessage}
                                onKeyDown={(e) => e.code === "Enter" && handleSendMessage()}
                                style={{ flex: 1 }}
                            />
                            {img && (
                                <div className="img-preview" style={{ marginRight: '10px', fontSize: '0.8rem', color: '#fff' }}>
                                    Image: {img.name} <span onClick={() => setImg(null)} style={{ cursor: 'pointer', color: 'red' }}>x</span>
                                </div>
                            )}
                            <button onClick={handleSendMessage} className="btn-primary">Send</button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <h2 className="gradient-text">Welcome to ChatVerse</h2>
                        <p>Select a chat or search for a user to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
