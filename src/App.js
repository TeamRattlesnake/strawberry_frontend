import React, { useState } from 'react';
import { View, AdaptivityProvider, AppRoot, ConfigProvider, SplitLayout, SplitCol, Snackbar, Spacing, usePlatform } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';

import Home from './panels/Home';
import GenerationPage from './panels/Generation';
import { Icon28CancelCircleOutline, Icon28CheckCircleOutline, Icon28InfoCircleOutline } from '@vkontakte/icons';

import ico_crying from "./media/crying.gif";
import ico_normal from "./media/normal.gif";
import ico_ok from "./media/ok.gif";


const App = () => {
	const [snackbar, setSnackbar] = useState(null);
	const [dataset, setDataset] = useState({
		to: "home",
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

	const go = data => {setDataset((prev) => {
		return {...prev, ...data};
	})};

	return (
		<ConfigProvider>
			<AdaptivityProvider>
				<AppRoot>
					<SplitLayout>
						<SplitCol>
							<View activePanel={dataset.to}>
								<Home
									id='home'
									go={go}
									dataset={dataset}
								/>
								<GenerationPage
									id="text_editor"
									go={go}
									dataset={dataset}
								/>
							</View>
						</SplitCol>
						{snackbar}
					</SplitLayout>
				</AppRoot>
			</AdaptivityProvider>
		</ConfigProvider>
	);
}

export default App;
