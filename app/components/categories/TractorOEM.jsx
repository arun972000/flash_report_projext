import dynamic from "next/dynamic";
import TractorApplication from "../DummyAppSplit/Tractor";
import Tractor_EV from '../ev/Tractor_ev'

const Tractor_Piechart = dynamic(
    () => import("../charts/TractorPieChart"),
    { ssr: false }
);

import TractorForecast from '../Forecast-chart/Tractor';
import './category.css'

const TractorOEM = async () => {
    const tractorTextRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}api/admin/flash-dynamic/flash-reports-text`, { cache: 'no-store' })
    const tractorText = await tractorTextRes.json();
    return (
        <div className='px-lg-4'>
            <div className='container-fluid'>
                <div className="row">
                    <div className='col-12'>
                        <h3>
                            Tractor OEM
                        </h3>
                        <div
                            className='category_content'
                            style={{ textAlign: 'justify' }}
                            dangerouslySetInnerHTML={{ __html: tractorText.tractor || '<p>content is loading...</p>' }}
                        />
                    </div>

                    <div className='col-12 mt-3'>
                        <Tractor_Piechart />
                    </div>
                    <div className="col-12 mt-5">
                        <Tractor_EV />
                    </div>
                    <div className="col-12">
                        <h3 className="mt-4">
                            Forecast Chart
                        </h3>
                        <TractorForecast />
                    </div>

                    <div className="col-12">
                        <h3 className="mt-4">
                            Application Chart
                        </h3>
                        <TractorApplication />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TractorOEM;
