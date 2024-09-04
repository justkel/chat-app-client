import React from 'react';
import Dashboard from '../components/Layout'

const Home: React.FC = () => {
    return (
        <Dashboard>
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
            </div>

        </Dashboard>
    );
};

export default Home;