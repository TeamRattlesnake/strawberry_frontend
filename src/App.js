import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { View, AdaptivityProvider, AppRoot, ConfigProvider, SplitLayout, SplitCol, Snackbar } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';

import Home from './panels/Home';
import { Generate, GenerationResult } from './panels/Generation';
import { Icon28CancelCircleOutline, Icon28CheckCircleOutline, Icon28InfoCircleOutline } from '@vkontakte/icons';
import TextEditor from './panels/TextEditor';


const App = () => {
	const [snackbar, setSnackbar] = useState(null);
	const [dataset, setDataset] = useState({
		to: "home",
		showSnackBar: ({text, type}) => {
			let icon, img_src;
			switch (type) {
				case "success":
					icon = <Icon28CheckCircleOutline fill="var(--vkui--color_icon_positive)" />
					img_src = "https://media.tenor.com/NGh3aVoXP2kAAAAj/strawberry.gif";
					break;
				case "danger":
					icon = <Icon28CancelCircleOutline fill="var(--vkui--color_icon_negative)" />
					img_src = "https://media.tenor.com/azaqzpGX2-kAAAAi/strawberry-fruit.gif";
					break;
				default:
					icon = <Icon28InfoCircleOutline/>
					img_src = "https://media.tenor.com/1fokKcxMy1EAAAAj/strawberry-fruit.gif";
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
	const [fetchedUser, setUser] = useState(null);

	useEffect(() => {
		bridge.send('VKWebAppGetUserInfo')
		.then((data) => {
			setUser(data);
		}).catch((error) => {
			console.log(error);
		})
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
							<View activePanel={dataset.to}>
								<Home id='home' go={go} fetchedUser={fetchedUser} dataset={dataset}/>
								<TextEditor id="text_editor" go={go} dataset={dataset}/>
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
