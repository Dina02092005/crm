'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    FaHome,
    FaUser,
    FaCar,
    FaMapMarkerAlt,
    FaCog,
    FaBell,
    FaChartBar,
    FaCalendar,
    FaEnvelope,
    FaPhone,
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaDownload,
    FaUpload,
    FaSave,
    FaTimes,
    FaCheck,
    FaExclamationTriangle,
    FaInfoCircle,
    FaStar,
    FaHeart,
    FaShare,
    FaFilter,
    FaSort,
    FaArrowUp,
    FaArrowDown,
    FaArrowLeft,
    FaArrowRight,
} from 'react-icons/fa';

const iconCategories = [
    {
        title: 'Navigation',
        icons: [
            { Icon: FaHome, name: 'Home' },
            { Icon: FaUser, name: 'User' },
            { Icon: FaCar, name: 'Car' },
            { Icon: FaMapMarkerAlt, name: 'Location' },
            { Icon: FaCog, name: 'Settings' },
            { Icon: FaBell, name: 'Notifications' },
        ],
    },
    {
        title: 'Data & Analytics',
        icons: [
            { Icon: FaChartBar, name: 'Chart' },
            { Icon: FaCalendar, name: 'Calendar' },
            { Icon: FaFilter, name: 'Filter' },
            { Icon: FaSort, name: 'Sort' },
        ],
    },
    {
        title: 'Communication',
        icons: [
            { Icon: FaEnvelope, name: 'Email' },
            { Icon: FaPhone, name: 'Phone' },
            { Icon: FaShare, name: 'Share' },
        ],
    },
    {
        title: 'Actions',
        icons: [
            { Icon: FaSearch, name: 'Search' },
            { Icon: FaPlus, name: 'Add' },
            { Icon: FaEdit, name: 'Edit' },
            { Icon: FaTrash, name: 'Delete' },
            { Icon: FaDownload, name: 'Download' },
            { Icon: FaUpload, name: 'Upload' },
            { Icon: FaSave, name: 'Save' },
        ],
    },
    {
        title: 'Status & Feedback',
        icons: [
            { Icon: FaCheck, name: 'Success' },
            { Icon: FaTimes, name: 'Close' },
            { Icon: FaExclamationTriangle, name: 'Warning' },
            { Icon: FaInfoCircle, name: 'Info' },
            { Icon: FaStar, name: 'Star' },
            { Icon: FaHeart, name: 'Favorite' },
        ],
    },
    {
        title: 'Arrows',
        icons: [
            { Icon: FaArrowUp, name: 'Up' },
            { Icon: FaArrowDown, name: 'Down' },
            { Icon: FaArrowLeft, name: 'Left' },
            { Icon: FaArrowRight, name: 'Right' },
        ],
    },
];

export default function ReactIconsExample() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>React Icons Example</CardTitle>
                    <CardDescription>
                        Comprehensive icon library with Font Awesome icons
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {iconCategories.map((category) => (
                            <div key={category.title}>
                                <h3 className="text-lg font-semibold mb-3">{category.title}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {category.icons.map(({ Icon, name }) => (
                                        <div
                                            key={name}
                                            className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors"
                                        >
                                            <Icon className="text-2xl" />
                                            <span className="text-xs text-center">{name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Usage Examples */}
            <Card>
                <CardHeader>
                    <CardTitle>Icon Usage Examples</CardTitle>
                    <CardDescription>
                        Different ways to use icons in your components
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* In Buttons */}
                    <div>
                        <h4 className="font-semibold mb-2">In Buttons</h4>
                        <div className="flex gap-2 flex-wrap">
                            <Button>
                                <FaPlus className="mr-2" />
                                Add Driver
                            </Button>
                            <Button variant="outline">
                                <FaEdit className="mr-2" />
                                Edit
                            </Button>
                            <Button variant="destructive">
                                <FaTrash className="mr-2" />
                                Delete
                            </Button>
                            <Button variant="secondary">
                                <FaDownload className="mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Different Sizes */}
                    <div>
                        <h4 className="font-semibold mb-2">Different Sizes</h4>
                        <div className="flex items-center gap-4">
                            <FaCar className="text-sm" />
                            <FaCar className="text-base" />
                            <FaCar className="text-lg" />
                            <FaCar className="text-xl" />
                            <FaCar className="text-2xl" />
                            <FaCar className="text-3xl" />
                            <FaCar className="text-4xl" />
                        </div>
                    </div>

                    {/* With Colors */}
                    <div>
                        <h4 className="font-semibold mb-2">With Colors</h4>
                        <div className="flex items-center gap-4">
                            <FaHeart className="text-2xl text-red-500" />
                            <FaStar className="text-2xl text-yellow-500" />
                            <FaCheck className="text-2xl text-green-500" />
                            <FaExclamationTriangle className="text-2xl text-orange-500" />
                            <FaInfoCircle className="text-2xl text-blue-500" />
                        </div>
                    </div>

                    {/* Status Badges */}
                    <div>
                        <h4 className="font-semibold mb-2">Status Badges</h4>
                        <div className="flex gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-sm">
                                <FaCheck />
                                Active
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-sm">
                                <FaCar />
                                On Trip
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-full text-sm">
                                <FaTimes />
                                Offline
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
