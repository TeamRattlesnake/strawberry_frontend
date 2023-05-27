import React, { useEffect, useState } from 'react';

import { Group, Div, Spacing, Separator, Pagination, Spinner, Tabs, TabsItem, Search, usePlatform, Banner, Button, Image } from '@vkontakte/vkui';
import StrawberryBackend from '../../../api/SBBackend';

import imgQuestion from "../../../media/question.gif";
import imgCrying from "../../../media/crying.gif";

import { Route } from '../../../router';
import { useRouter } from '@happysanta/router';
import GroupItem from './GroupItem';


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

const GroupListHeader = ({showGroups, searchQuery, setSearchQuery, groups, totalPages, currentPage, filterMode, setCurrentPage, setFilterMode}) => {
	return (
		<>
			<Tabs>
				{
					Object.values(FilterMode).map((fm) => {
						return (
							<TabsItem
								key={fm.id}
								selected={filterMode === fm}
								onClick={() => setFilterMode(fm)}
							>
								{fm.alias}
							</TabsItem>
						)
					})
				}
			</Tabs>
			{
				showGroups &&
				<Spacing size={24}>
					<Separator />
				</Spacing>
			}
			{
				showGroups && filterMode === FilterMode.ALL &&
				<Search
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			}
			{
				groups && totalPages > 1 &&
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					onChange={(page) => setCurrentPage(page)}
					siblingCount={1}
					boundaryCount={1}
				/>
			}
		</>
	)
}

const GroupListContent = ({groups, handleGenerate, showGroups, setShowGroups, isLoading}) => {
	const accessFallback = (
		<Banner
			before={
				<Image
					size={96}
					src={imgQuestion}
				/>
			}
			subheader="Пока здесь нет сообществ. Разрешите право на просмотр списка ваших сообществ, чтобы создать пост."
			actions={<Button onClick={() => setShowGroups(true)}>Разрешить</Button>}
		/>
	);
	if (isLoading) return (<Div><Spinner/></Div>);
	if (!showGroups) return accessFallback;
	return (
		(!groups || groups.length === 0) ?
		(
			<Div>
				<div style={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					textAlign: "center",
					width: "100%"
				}}>
					<img height="auto" width="100px" src={imgCrying}></img>
					<span>Нет данных</span>
				</div>
			</Div>
		)
		:
		(
			<>
				{groups.map((group) => <GroupItem key={group.id} group={group} onGenerate={handleGenerate}/>)}
			</>
		)
	)
}

const GroupList = ({ go, dataset }) => {
	const [groupsData, setGroupsData] = useState({
		loading: true,
		items: [],
	});
	const [filterMode, setFilterMode] = useState(FilterMode.ALL);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const [showGroups, setShowGroups] = useState(false);
	const [perPage, _] = useState(7);

	const targetScope = 'groups';

	const router = useRouter();

	useEffect(() => {
		showGroups && setGroupsData((prev) => ({...prev, loading: false}));
	}, [showGroups]);
	
	const updateShowGroups = (onPostUpdate) => { // обновить условие отображение плашки о разрешениях
		StrawberryBackend.hasScope(targetScope)
		.then((ok) => {
			!ok && setGroupsData((prev) => ({...prev, loading: false}));
			setShowGroups(ok);
		})
		.finally(() => {
			onPostUpdate && onPostUpdate();
		})
	}

	const handleGenerate = (group) => {
		StrawberryBackend.fetchGroupPosts(group.id, 20)
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
			router.pushPage(Route.PAGE_GENERATION, {group});
		})
		.catch((error) => {
			console.log(error);
			dataset.showSnackBar({text: `Ошибка во время извлечения тематики группы`, type: "danger"});
		})
	};

	const handleFetchGroups = () => {
		if (!showGroups) return;
		let mode;
		switch (filterMode) {
			case FilterMode.MANAGED:
				mode = "moder";
				break;
			case FilterMode.ALL:
				mode = "";
				break;
			default:
				return;
		}
		setGroupsData((prev) => ({
			...prev,
			loading: true,
		}));
		StrawberryBackend.getGroups(currentPage, perPage, mode)
		.then((resp) => {
			updateShowGroups(() => {
				setTotalPages(resp.count);
				setGroupsData((prev) => ({
					...prev,
					loading: false,
					items: resp.items
				}));
			})
		})
		.catch(() => {
			setGroupsData((prev) => ({
				...prev,
				loading: false,
			}));
		})
	}

	const handleSearchGroups = () => {
		setGroupsData((prev) => ({
			...prev,
			loading: true,
		}));
		StrawberryBackend.searchGroups(searchQuery, currentPage, perPage)
		.then((resp) => {
			updateShowGroups(() => {
				setTotalPages(resp.count);
				setGroupsData((prev) => ({
					...prev,
					loading: false,
					items: resp.items
				}));
			})
		})
		.catch((error) => {
			console.log(error);
			setGroupsData((prev) => ({
				...prev,
				loading: false,
			}));
		})
	}

	const updateData = () => {
		if (searchQuery) {
			handleSearchGroups();
		} else {
			handleFetchGroups();
		}
	}

	useEffect(() => {
		showGroups && updateData();
	}, [showGroups])

	// при первой загрузке проверяем есть ли у нас права группы, выставляем соответствующий showGroups
	useEffect(() => {
		updateShowGroups();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
		setSearchQuery(''); // опустошаем поисковый запрос
	}, [filterMode]) 

	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery]);

	useEffect(() => {
		updateData();
	}, [searchQuery, filterMode, currentPage])

	return (
		<Group>
			<GroupListHeader
				showGroups={showGroups}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				groups={groupsData.items}
				totalPages={totalPages}
				currentPage={currentPage}
				filterMode={filterMode}
				setCurrentPage={setCurrentPage}
				setFilterMode={setFilterMode}
			/>
			<Spacing size={24}>
				<Separator />
			</Spacing>
			<GroupListContent
				groups={groupsData.items}
				handleGenerate={handleGenerate}
				showGroups={showGroups}
				setShowGroups={setShowGroups}
				isLoading={groupsData.loading}
			/>
		</Group>
	)
}

export default GroupList;
