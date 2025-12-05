import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
    endDate: string;
    prefix?: string;
    className?: string;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const Countdown: React.FC<CountdownProps> = ({
    endDate,
    prefix = 'Ends in: ',
    className = ''
}) => {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

    function calculateTimeLeft(): TimeLeft {
        // Parse endDate và set đến cuối ngày (23:59:59)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const difference = end.getTime() - new Date().getTime();

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 &&
        timeLeft.minutes === 0 && timeLeft.seconds === 0;

    if (isExpired) {
        return (
            <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
                <Clock className="w-4 h-4" />
                <span>Ended</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 text-red-600 font-semibold ${className}`}>
            <Clock className="w-4 h-4" />
            <span>{prefix}</span>
            <div className="flex gap-1">
                {timeLeft.days > 0 && (
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">
                        {timeLeft.days}d
                    </span>
                )}
                <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">
                    {String(timeLeft.hours).padStart(2, '0')}h
                </span>
                <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">
                    {String(timeLeft.minutes).padStart(2, '0')}m
                </span>
                <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">
                    {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
            </div>
        </div>
    );
};

export default Countdown;