import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraOutlined, CheckOutlined } from '@ant-design/icons';
import { Spin, message, Button } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useGetUserById } from '../hooks/useGetOtherUser';
import { useUpdateProfile } from '../hooks/useUpdateProfile';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const userId = useMemo(() => {
        if (!user?.token) return null;
        try {
            const decoded: any = jwtDecode(user.token);
            return decoded.sub;
        } catch {
            return null;
        }
    }, [user]);

    const {
        data: userData,
        loading: userLoading,
        error: userError,
        refetch,
    } = useGetUserById(userId!);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { updateProfile, loading: updating } = useUpdateProfile();

    useEffect(() => {
        if (userData?.getUserById) {
            const u = userData.getUserById;
            setFirstName(u.firstName || '');
            setLastName(u.lastName || '');
            setPreview(u.profilePicture ? `http://localhost:5002${u.profilePicture}` : null);
        }
    }, [userData]);

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            if (!f.type.startsWith('image/')) {
                message.error('Please select an image file');
                return;
            }
            setFile(f);
        }
    };

    const handleSave = async () => {
        if (!userId) {
            message.error('Unable to identify user');
            return;
        }

        if (!firstName.trim() || !lastName.trim()) {
            message.error('First and last name cannot be empty');
            return;
        }

        try {
            await updateProfile({
                userId,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                profilePicture: file ?? undefined,
            });

            message.success({
                content: <span className="font-montserrat">Profile updated</span>,
            });
            setFile(null);
            refetch?.();
        } catch (err: any) {
            console.error(err);
            message.error({
                content: <span className="font-montserrat">{err?.message || 'Update failed'}</span>,
            });
        }
    };

    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]">
                <Spin size="large" />
            </div>
        );
    }

    if (userError) {
        return <div className="min-h-screen flex items-center justify-center text-red-400">Error loading profile.</div>;
    }
    const isDefaultPicture = userData?.getUserById?.profilePicture === '/uploads/default-profile.jpg';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-neutral-900 to-black p-6 font-montserrat">
            <div
                className="w-full max-w-2xl rounded-3xl p-8 relative"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                    boxShadow: '0 8px 40px rgba(2,6,23,0.7)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.04)',
                }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-white text-2xl font-semibold">Your profile</h2>
                        <p className="text-sm text-neutral-400">Update profile picture, first name & last name</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => navigate(-1)}
                            className="rounded-lg text-white bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-neutral-700 font-montserrat"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleSave}
                            loading={updating}
                            className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 border-0 shadow font-montserrat"
                        >
                            Save changes
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-xl border border-neutral-800">
                            {preview ? (
                                <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center text-neutral-400">
                                    <span className="uppercase text-sm">{(firstName || 'U').charAt(0)}</span>
                                </div>
                            )}

                            <label
                                title="Change profile picture"
                                className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white/9 backdrop-blur-sm flex items-center justify-center cursor-pointer border border-neutral-700"
                            >
                                <CameraOutlined className="text-white text-lg" />
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>

                        <div className="mt-4 text-sm text-neutral-400">{preview ? 'Preview' : 'No profile picture set'}</div>

                        <div className="mt-6">
                            <Button
                                type="default"
                                onClick={async () => {
                                    if (!userId) return;
                                    try {
                                        await updateProfile({ userId, profilePicture: undefined });
                                        message.success('Removed profile picture');
                                        refetch?.();
                                        setPreview(
                                            userData?.getUserById?.profilePicture
                                                ? `http://localhost:5002${userData.getUserById.profilePicture}`
                                                : null
                                        );
                                    } catch (err: any) {
                                        message.error(err?.message || 'Failed');
                                    }
                                }}
                                disabled={isDefaultPicture}
                                className="rounded-md text-white bg-[rgba(255,255,255,0.02)] font-montserrat disabled:opacity-40 disabled:cursor-not-allowed disabled:text-white"
                            >
                                Remove picture
                            </Button>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-neutral-300 mb-2">First name</label>
                                <input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none"
                                    placeholder="First name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-neutral-300 mb-2">Last name</label>
                                <input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none"
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm text-neutral-300 mb-2">Email</label>
                            <input
                                value={userData?.getUserById?.email ?? ''}
                                disabled
                                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-neutral-800 text-neutral-400 placeholder-neutral-500 focus:outline-none"
                                placeholder="Email"
                            />
                            <div className="mt-2 text-xs text-neutral-500">Email cannot be changed here</div>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <Button
                                type="primary"
                                onClick={handleSave}
                                loading={updating}
                                className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 border-0 shadow font-montserrat"
                            >
                                <CheckOutlined /> &nbsp; Save Profile
                            </Button>

                            <Button
                                type="text"
                                onClick={() => {
                                    setFirstName(userData?.getUserById?.firstName ?? '');
                                    setLastName(userData?.getUserById?.lastName ?? '');
                                    setFile(null);
                                    setPreview(
                                        userData?.getUserById?.profilePicture
                                            ? `http://localhost:5002${userData.getUserById.profilePicture}`
                                            : null
                                    );
                                    message.info('Changes discarded');
                                }}
                                className="text-neutral-400 font-montserrat"
                            >
                                Discard
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
