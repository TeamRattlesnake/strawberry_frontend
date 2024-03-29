import React, { useEffect, useState } from 'react';
import { AdaptivityProvider, AppRoot, ConfigProvider, SplitLayout, SplitCol, Snackbar, Root } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';

import { Icon28CancelCircleOutline, Icon28CheckCircleOutline, Icon28InfoCircleOutline } from '@vkontakte/icons';

import ico_crying from "./media/crying.gif";
import ico_normal from "./media/normal.gif";
import ico_ok from "./media/ok.gif";
import GeneralView from './views/General';
import { showSlides, startupData } from './api/slides';
import API, { APICallbacks } from './api/API';
import { useLocation } from '@happysanta/router';
import { ViewAlias } from './const';


const App = () => {
	const location = useLocation();
	useEffect(() => {
		API.getLSKey("slides_shown")
		.then((ok) => {
			if (!ok) {
				showSlides(startupData, () => API.setLSKey("slides_shown", true));
			}
		})
	}, []);
	const [snackbar, setSnackbar] = useState(null);
	const [dataset, setDataset] = useState({
		showSnackBar: ({text, type}) => {
			let icon, img_src;
			switch (type) {
				case "success":
					icon = <Icon28CheckCircleOutline fill="var(--vkui--color_icon_positive)" />
					img_src = ico_ok;
					break;
				case "danger":
					icon = <Icon28CancelCircleOutline fill="var(--vkui--color_icon_negative)" />
					img_src = ico_crying;
					break;
				default:
					icon = <Icon28InfoCircleOutline/>
					img_src = ico_normal;
					break;
			}
			setSnackbar(
				<Snackbar
					onClose={() => setSnackbar(null)}
					before={icon}
				>
					<div style={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center"
					}}>
						<span style={{
							display: "flex",
							justifyContent: "center",
							alignContent: "center",
						}}>{text}</span>
						{img_src && <img height="40px" width="auto" src={img_src}/>}
					</div>
				</Snackbar>
			);
		}
	});

	useEffect(() => {
		APICallbacks.push((res) => {
			if (res.status === 503) {
				dataset.showSnackBar({
					text: 'Слишком много запросов! Попробуйте позже.',
					type: 'danger',
				})
				return null;
			}
			return res;
		});
	}, []);

	const go = data => {setDataset((prev) => {
		return {...prev, ...data};
	})};


	return (
		<ConfigProvider>
			<AdaptivityProvider>
				<AppRoot>
					<SplitLayout>
						<SplitCol>
							<Root activeView={location.getViewId()}>
								<GeneralView
									id={ViewAlias.VIEW_GENERAL}
									go={go}
									dataset={dataset}
								/>
							</Root>
						</SplitCol>
						{snackbar}
					</SplitLayout>
				</AppRoot>
			</AdaptivityProvider>
		</ConfigProvider>
	);
}

export default App;
