import React, { useEffect, useState } from 'react';
import { Card, Button, Spin, notification } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useFetchChatRequests } from '../hooks/useFetchChatRequests';
import { useApproveChatRequest } from '../hooks/useApproveChatRequest';
import { useRejectChatRequest } from '../hooks/useRejectChatRequest';
import Dashboard from '../components/Layout';
import Title from 'antd/es/typography/Title';

const ChatRequests = () => {
    const { user } = useAuth();
    const [userId, setUserId] = useState<string | null>(null);
    const [requests, setRequests] = useState([]);
    const { approveChatRequest } = useApproveChatRequest();
    const { rejectChatRequest } = useRejectChatRequest();

    useEffect(() => {
        if (user) {
            const decodedToken: any = jwtDecode(user.token);
            setUserId(decodedToken.sub);
        }
    }, [user]);

    const { data, loading, error } = useFetchChatRequests(userId);

    useEffect(() => {
        if (data) {
            setRequests(data.getChatRequests);
        }
    }, [data]);

    const handleApprove = async (requestId: string) => {
        try {
            await approveChatRequest(requestId);
            notification.success({
                message: 'Request Approved',
                description: 'You have successfully approved the chat request.',
            });
            // Optionally refetch or update the requests list
        } catch (err) {
            notification.error({
                message: 'Approval Failed',
                description: 'An error occurred while approving the request.',
            });
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await rejectChatRequest(requestId);
            notification.success({
                message: 'Request Rejected',
                description: 'You have successfully rejected the chat request.',
            });
            // Optionally refetch or update the requests list
        } catch (err) {
            notification.error({
                message: 'Rejection Failed',
                description: 'An error occurred while rejecting the request.',
            });
        }
    };

    if (loading) return <Spin size="large" style={{ display: 'block', margin: '0 auto' }} />;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <Dashboard>
            <div className='pt-6 px-3'>
                <Title level={2}>Pending Requests</Title>
            </div>

            <div style={{ padding: '20px' }}>
                {requests.length === 0 ? (
                    <p>No chat requests</p>
                ) : (
                    requests.map((request: any) => (
                        <Card
                            key={request.id}
                            title={
                                <span style={{ fontFamily: 'Poppins, sans-serif' }}>{request.requester?.fullName}</span>
                            }
                            extra={
                                <>
                                    <Button
                                        type="primary"
                                        onClick={() => handleApprove(request.id)}
                                        style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '500' }}
                                    >
                                        Accept
                                    </Button>
                                    <Button
                                        type="default"
                                        danger
                                        onClick={() => handleReject(request.id)}
                                        style={{ marginLeft: '10px', fontFamily: 'Poppins, sans-serif', fontWeight: '500' }}
                                    >
                                        Reject
                                    </Button>
                                </>
                            }
                            style={{ marginBottom: '10px' }}
                        >
                        </Card>
                    ))
                )}
            </div>
        </Dashboard>

    );
};

export default ChatRequests;
