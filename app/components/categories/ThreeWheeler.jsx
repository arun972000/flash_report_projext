import dynamic from "next/dynamic";
import ThreeWheelerEV from "../ev/Threewheeler-EV";

const ThreeWheeler_Piechart = dynamic(
    () => import("../charts/ThreeWheeler-PieChart"),
    { ssr: false }
);

const ThreeWheelerApplication = dynamic(
    () => import("../application-split/ThreeWheeler"),
    { ssr: false }
);

const ThreeWheelerForecast = dynamic(
    () => import("../Forecast-chart/ThreeWheeler"),
    { ssr: false }
);

const ThreeWheeler = async () => {
    const threeWheelerTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const threeWheelerText = await threeWheelerTextRes.json();
    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h3>
                            Three-Wheeler Market Summary – April 2025
                        </h3>
                        <div
                            className=''
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: threeWheelerText.threewheeler || '<p>content is loading...</p>'}}
                        />
                    </div>

                    <div className='col-12 mt-3'>
                        <ThreeWheeler_Piechart />
                    </div>

                    <div className="col-12 mt-5">
                        <ThreeWheelerEV />
                    </div>

                    <div className="col-12">
                        <h2 className="mt-4">
                            Forecast Chart
                        </h2>
                        <ThreeWheelerForecast />
                    </div>

                    <div className="col-12 mt-5">
                        <h2 className="mt-4">
                            Application Chart
                        </h2>
                        <ThreeWheelerApplication />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ThreeWheeler;
