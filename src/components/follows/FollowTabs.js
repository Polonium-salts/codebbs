'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import UserList from './UserList';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function FollowTabs({ following, followers }) {
  const [selectedTab, setSelectedTab] = useState(0);
  
  const tabs = [
    { name: `关注 (${following.length})`, content: following },
    { name: `粉丝 (${followers.length})`, content: followers }
  ];
  
  return (
    <div className="w-full">
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-4">
          {tabs.map((tab, index) => (
            <Tab.Panel
              key={index}
              className={classNames(
                'rounded-xl bg-white p-3',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
              )}
            >
              <UserList users={tab.content} />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
} 