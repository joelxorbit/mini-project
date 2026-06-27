import React from 'react';

export default function PlaceHolder({ title }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This feature is currently under development.</p>
      </div>
      <div className="glass rounded-xl p-12 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Coming Soon</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">We are working hard to bring you the {title} feature.</p>
      </div>
    </div>
  );
}
