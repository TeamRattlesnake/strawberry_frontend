import React, { useEffect, useState } from 'react';

import { Panel, PanelHeader, Group, Cell, Div, Avatar, RichCell, IconButton, Tabs, TabsItem, Spacing, Separator, Pagination, Spinner } from '@vkontakte/vkui';
import { Icon24AddSquareOutline, Icon28SettingsOutline, Icon28StarsOutline, Icon24StarsOutline, Icon28CheckCircleOutline, Icon24ClockOutline } from '@vkontakte/icons';
import StrawberryBackend from '../api/SBBackend';


const GroupList = ({ go, dataset }) => {
	const [groups, setGroups] = useState([]);
	const [selected, setSelected] = useState("groupsConnected");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(false);

	let checkGroupsStatusesInterval;

	const perPage = 10;

	const onConnect = (group, idx) => {
		if (group.connected) return;
		StrawberryBackend.fetchGroupPosts(group.id, 100)
		.then((texts) => {
			if (texts.length > 0) {
				StrawberryBackend.addGroup(group.id, texts).then((_) => {
					group.connected = true;
					setGroups((prev) => {
						prev[idx] = group;
						return prev
					});
				});
			} else {
				dataset.showSnackBar({text: `Сообщество "${group.name}" не содержит данных для обучения.`, type: "danger"});
			}
		});
	};

	const onGenerate = (group) => {
		if (!group.ready) return;
		StrawberryBackend.getGroup(group.id).then((groupBack) => {
			console.log('groupBack', groupBack);
			if (groupBack.status !== 0) {
				dataset.showSnackBar({text: `Сообщество "${group.name}" еще не готово!`, type: "info"});
				return
			}
			go({
				to: "generate",
				targetGroup: group,
			})
		})
	};

	const onGroupClick = (group, idx) => {
		if (selected === "groupsConnected") {
			onGenerate(group);
		} else {
			onConnect(group, idx);
		}
	}

	useEffect(() => {
		setCurrentPage(1);
	}, [selected]);

    useEffect(() => {
		setIsLoading(true);
		let getGroups;
		switch (selected) {
			case "groupsConnected":
				getGroups = StrawberryBackend.getGroupsConnected;
				break;
			case "groupsManaged":
				clearInterval(checkGroupsStatusesInterval);
				getGroups = StrawberryBackend.getGroupsManaged;
				break;
		}
		getGroups && getGroups(currentPage, perPage)
		.then((resp) => {
			setTotalPages(resp.count);
			setGroups(resp.items);
			if (selected === "groupsConnected") checkGroupsStatusesInterval = setInterval(() => {
				StrawberryBackend.getGroupsStatuses(resp.items.map((group) => group.id)).then((statuses) => {
					setGroups((prev) => {
						return prev.length == statuses.length ?
						prev.map((item, ind) => {
							item.ready = statuses[ind];
							return item
						}) : prev;
					});
				})
			}, 10000);
			setIsLoading(false);
		})
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
									<IconButton onClick={() => onGroupClick(group, idx)}>
										{selected === "groupsConnected" ?
										(
											group.ready ? <Icon24StarsOutline aria-label='Сгенерировать'/> : <Icon24ClockOutline aria-label='Подождите'/>
										)
										:
										(
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
			<Group>
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
			</Group>
		</Panel>
	);
};

export default Home;
