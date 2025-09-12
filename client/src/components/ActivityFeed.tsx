import React from 'react';
import { MessageSquare, Upload, User } from 'lucide-react';

interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials?: string;
  };
  action: string;
  target?: string;
  targetType?: 'project' | 'file' | 'comment';
  time: string;
  icon?: 'comment' | 'upload' | 'user';
  iconColor?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, title = 'פעילות' }) => {
  const getIcon = (iconType?: string) => {
    switch (iconType) {
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'upload':
        return <Upload className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getAvatar = (user: ActivityItem['user']) => {
    if (user.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.name}
          className="h-8 w-8 rounded-full"
        />
      );
    }
    
    const colors = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-orange-400 to-red-400',
      'from-indigo-400 to-purple-400'
    ];
    
    const colorIndex = user.name.charCodeAt(0) % colors.length;
    
    return (
      <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center`}>
        <span className="text-xs font-medium text-white">
          {user.initials || user.name.substring(0, 2).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-soft p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getAvatar(activity.user)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm">
                  <span className="font-semibold text-gray-900">{activity.user.name}</span>
                  <span className="text-gray-600 mx-1">{activity.action}</span>
                  {activity.target && (
                    <span className="font-medium text-primary-600 hover:text-primary-700 cursor-pointer">
                      {activity.target}
                    </span>
                  )}
                </p>
                {activity.icon && (
                  <div className={`${activity.iconColor || 'text-gray-400'}`}>
                    {getIcon(activity.icon)}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
