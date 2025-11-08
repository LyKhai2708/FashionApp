import { RotateCcw, Phone, MapPin, CardSim } from 'lucide-react';

export default function PolicyBenefits() {
    const policies = [
        {
            icon: <CardSim size={32} />,
            title: 'Thanh toán dễ dàng, an toàn 100%',
        },
        {
            icon: <RotateCcw size={32} />,
            title: '60 ngày đổi trả vì bất kỳ lý do gì',
        },
        {
            icon: <Phone size={32} />,
            title: 'Hotline 0896.670.687 hỗ trợ từ 8h30 - 22h',
        },
        {
            icon: <MapPin size={32} />,
            title: 'Đến tận nơi nhận hàng trả, hoàn tiền trong 24h',
        }
    ];

    return (
        <div className="bg-gray-100 rounded-lg p-6 mt-8">
            <div className="grid grid-cols-1 text-xs md:text-base md:grid-cols-2 gap-6">
                {policies.map((policy, index) => (
                    <div key={index} className="flex items-start justify-center gap-4">
                        <div className="flex-shrink-0 w-5 h-5 md:w-12 md:h-12 flex items-center justify-center border-2 border-black rounded-lg">
                            {policy.icon}
                        </div>
                        <div className="flex-1">
                            {policy.title}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
