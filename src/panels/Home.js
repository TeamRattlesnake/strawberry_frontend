import React, { useEffect, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';
import PropTypes from 'prop-types';

import { Panel, PanelHeader, Group, Cell, Div, Avatar, RichCell, IconButton, Tabs, TabsItem, Spacing, Separator, Pagination, Spinner } from '@vkontakte/vkui';
import { Icon24AddSquareOutline, Icon28SettingsOutline, Icon28StarsOutline, Icon24StarsOutline } from '@vkontakte/icons';
import StrawberryBackend from '../api/SBBackend';


const GroupList = ({ go, accessToken, dataset }) => {
	const [groups, setGroups] = useState([]);
	const [selected, setSelected] = useState("groupsConnected");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(false);

	const perPage = 10;

	useEffect(() => {
		setCurrentPage(1);
	}, [selected]);

    useEffect(() => {
		setIsLoading(true);
		switch (selected) {
			case "groupsConnected":
				StrawberryBackend.getGroups(accessToken, (currentPage-1)*perPage, perPage).then((resp) => {
					if (!resp.groups) {
						setIsLoading(false);
						return
					}
					bridge.send('VKWebAppCallAPIMethod', {
						method: 'groups.getById',
						params: {
							v: '5.131',
							group_ids: resp.groups.map(({id}) => id).join(','),
							access_token: accessToken
						}
					}).then((vkResp) => {
						if (vkResp.response) {
							setGroups(resp.groups.map((group, idx) => {
								return {...group, ...vkResp.response[idx]}
							}));
							setTotalPages(resp.count);
						} else {
							setGroups([]);
						}
						setIsLoading(false);
					}).catch((error) => {
						setGroups([]);
						setIsLoading(false);
						console.log(error);
					})
				});
				break;
			case "groupsManaged":
				bridge.send('VKWebAppCallAPIMethod', {
					method: 'groups.get',
					params: {
						filter: "moder",
						extended: 1,
						v: '5.131',
						access_token: accessToken,
						offset: (currentPage-1)*perPage,
						count: perPage
					}})
					.then((data) => { 
						if (data.response) {
							setTotalPages(Math.ceil(data.response.count/perPage));
							setGroups(data.response.items);
							/*.map(async function (item) {
								return await StrawberryBackend.getGroup(accessToken, item.id)
								.then((group) => {
									item.connected = Boolean(group);
									return item
								})
								.catch((error) => {
									console.log(error);
									item.connected = false;
									return item
								})
							}));
							*/
						} else {
							setGroups([]);
						}
						setIsLoading(false);
					})
					.catch((error) => {
						setGroups([]);
						setIsLoading(false);
						console.log(error);
					}
				);
				break;
		}
	}, [selected, currentPage]);

	return (
		<Group>
			<Spacing size={24}>
				<Separator />
			</Spacing>
			<Tabs mode="ascent">
				<TabsItem
					before={<Icon28StarsOutline />}
					selected={selected === 'groupsConnected'}
					onClick={() => setSelected('groupsConnected')}
				>
					Подключенные сообщества
				</TabsItem>
				<TabsItem
					before={<Icon28SettingsOutline/>}
					selected={selected === 'groupsManaged'}
					onClick={() => setSelected('groupsManaged')}
				>
					Сообщества в управлении
				</TabsItem>
			</Tabs>
			<Spacing size={24}>
				<Separator />
			</Spacing>
			{
				isLoading && <Div><Spinner/></Div>
			}
			{
				!isLoading && groups && groups.length > perPage && <Pagination
					currentPage={currentPage}
					siblingCount={1}
					boundaryCount={1}
					totalPages={totalPages}
					onChange={(page) => setCurrentPage(page)}
					
				/>
			}
			{
				!isLoading && groups && groups.length > perPage && <Spacing size={24}>
					<Separator />
				</Spacing>
			}
			{
				!isLoading && groups && groups.map((group, idx) => {
					return (
						<RichCell
							key={idx}
							before={<Avatar src={group.photo_200}/>}
							after={
								<RichCell.Icon aria-hidden>
									<IconButton onClick={() => {
												if (group.connected) return;
												if (selected === "groupsConnected") {
													StrawberryBackend.getGroup(accessToken, group.id).then((groupBack) => {
														if (groupBack.status !== 0) {
															dataset.showSnackBar({text: `Сообщество "${group.name}" еще не готово!`, type: "info"});
															return
														}
														go({
															to: "generate",
															targetGroup: group,
														})
													})
												} else {
													StrawberryBackend.addGroup(accessToken, group.id, [
														"тест1",
														"тест2"
													])
												}
											}}>
										{selected === "groupsConnected" ? <Icon24StarsOutline aria-label='Сгенерировать'/> : (
											group.connected ? <Icon28CheckCircleOutline fill="var(--vkui--color_icon_positive)" /> : <Icon24AddSquareOutline aria-label='Подключить'/>
										)}
									</IconButton>
								</RichCell.Icon>
							}
							disabled
						>
							{group.name}
						</RichCell>
					)
				})
			}
			{
				!isLoading && groups.length === 0 && <Div>
					<div style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
						textAlign: "center",
						width: "100%"
					}}>
						<img height="auto" width="100px" src="https://media.tenor.com/azaqzpGX2-kAAAAi/strawberry-fruit.gif"></img>
						<span>Нет данных</span>
					</div>
				</Div>
			}
		</Group>
	)
}

const Home = ({ id, go, fetchedUser, accessToken, dataset }) => {
	return (
		<Panel id={id}>
			<PanelHeader>Управление</PanelHeader>
			{
				fetchedUser &&
				<Group>
					<Cell
						before={fetchedUser.photo_200 ? <Avatar src={fetchedUser.photo_200}/> : null}
						subtitle={fetchedUser.city && fetchedUser.city.title ? fetchedUser.city.title : ''}
					>
						{`${fetchedUser.first_name} ${fetchedUser.last_name}`}
					</Cell>
				</Group>
			}
			<GroupList go={go} accessToken={accessToken} dataset={dataset}/>
		</Panel>
	);
};

export default Home;
