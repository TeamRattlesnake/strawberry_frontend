import React, { useEffect, useState } from 'react';

import { Panel, PanelHeader, Group, Cell, Div, Avatar, RichCell, IconButton, Spacing, Separator, Pagination, Spinner, Tabs, TabsItem, CellButton, Search } from '@vkontakte/vkui';
import { Icon24StarsOutline } from '@vkontakte/icons';
import StrawberryBackend from '../api/SBBackend';


export const FilterMode = {
	ALL: {
		id: 'all',
		alias: 'Все сообщества',
		//icon: <Icon24StarsOutline/>
	},
	MANAGED: {
		id: 'managed',
		alias: 'В управлении',
		//icon: <Icon24StarsOutline/>
	}
}

const GroupList = ({ go, dataset }) => {
	const [groups, setGroups] = useState([]);
	const [filterMode, setFilterMode] = useState(FilterMode.ALL);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState(null);

	const perPage = 7;

	const onGenerate = (group) => {
		StrawberryBackend.fetchGroupPosts(group.id, 10)
		.then((texts) => {
			if (!texts) {
				dataset.showSnackBar({text: `Ошибка во время извлечения тематики группы`, type: "danger"});
				return
			}
			if (texts.length == 0) {
				dataset.showSnackBar({text: `Не хватает постов для построения тематики этой группы`, type: "danger"});
				return
			}
			group.texts = texts;
			group.mode = filterMode;
			go({
				to: "text_editor",
				targetGroup: group,
			})
		})
		.catch((error) => {
			console.log(error);
			dataset.showSnackBar({text: `Ошибка во время извлечения тематики группы`, type: "danger"});
		})
	};

	useEffect(() => {
		setCurrentPage(1);
		setGroups([]);
	}, [filterMode])

    useEffect(() => {
		setIsLoading(true);
		let promise;
		if (Boolean(searchQuery)) {
			promise = StrawberryBackend.searchGroups(searchQuery, currentPage, perPage)
		} else {
			let mode;
			switch (filterMode) {
				case FilterMode.MANAGED:
					mode = "moder";
					break;
				default:
					mode = "";
					break;
			}
			promise = StrawberryBackend.getGroups(currentPage, perPage, mode)
		}
		promise.then((resp) => {
			setTotalPages(resp.count);
			setGroups(resp.items);
		}).finally(() => {
			setIsLoading(false);
		})
	}, [searchQuery, filterMode, currentPage]);

	return (
		<Group>
			<Tabs>
				{
					Object.values(FilterMode).map((fm) => {
						return (
							<TabsItem
								//before={fm.icon}
								selected={filterMode === fm}
								onClick={() => setFilterMode(fm)}
								id={fm.id}
							>
								{fm.alias}
							</TabsItem>
						)
					})
				}
			</Tabs>
			<Spacing size={24}>
				<Separator />
			</Spacing>
			{
				groups && totalPages > 1 && (
					<>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Search
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
							<Pagination
								currentPage={currentPage}
								siblingCount={1}
								boundaryCount={1}
								totalPages={totalPages}
								onChange={(page) => setCurrentPage(page)}
							/>
						</div>
						<Spacing size={24}>
							<Separator />
						</Spacing>
					</>
				)
			}
			{
				isLoading && <Div><Spinner/></Div>
			}
			{
				!isLoading && groups && groups.map((group, idx) => {
					return (
						<RichCell
							key={idx}
							before={<Avatar src={group.photo_200}/>}
							after={
								<CellButton after={<Icon24StarsOutline aria-label='Сгенерировать'/>} onClick={() => onGenerate(group)}>
									Создать пост
								</CellButton>
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
				{
					/*
					fetchedUser &&
					<Group>
						<Cell
							before={fetchedUser.photo_200 ? <Avatar src={fetchedUser.photo_200}/> : null}
							subtitle={fetchedUser.city && fetchedUser.city.title ? fetchedUser.city.title : ''}
						>
							{`${fetchedUser.first_name} ${fetchedUser.last_name}`}
						</Cell>
					</Group>
					*/
				}
				<GroupList go={go} accessToken={accessToken} dataset={dataset}/>
		</Panel>
	);
};

export default Home;
