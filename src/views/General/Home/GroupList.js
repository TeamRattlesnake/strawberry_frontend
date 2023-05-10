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

const GroupListHeader = ({hasGroupsAccess, searchQuery, groups, totalPages, currentPage, filterMode, setCurrentPage, setFilterMode, setSearchQuery}) => {
	return (
		<>
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
			{
				hasGroupsAccess &&
				<Spacing size={24}>
					<Separator />
				</Spacing>
			}
			{
				hasGroupsAccess &&
				<>
					<Search
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{
						groups && totalPages > 1 &&
						<Pagination
							currentPage={currentPage}
							siblingCount={1}
							boundaryCount={1}
							totalPages={totalPages}
							onChange={(page) => setCurrentPage(page)}
						/>
					}
				</>
			}
		</>
	)
}

const GroupListContent = ({hasGroupsAccess, isLoading, setHasGroupsAccess, setCurrentPage, groups, handleGenerate}) => {
	const accessFallback = (
		<Banner
			before={
				<Image
					size={96}
					src={imgQuestion}
				/>
			}
			subheader="Пока здесь нет сообществ. Разрешите право на просмотр списка ваших сообществ, чтобы создать пост."
			actions={<Button onClick={() => setHasGroupsAccess(true) && setCurrentPage(1)}>Разрешить</Button>}
		/>
	);
	if (!hasGroupsAccess) return accessFallback;
	if (isLoading) return (<Div><Spinner/></Div>);
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
				{groups.map((group) => <GroupItem group={group} onGenerate={handleGenerate}/>)}
			</>
		)
	)
}

const GroupList = ({ go, dataset }) => {
	const [groups, setGroups] = useState([]);
	const [filterMode, setFilterMode] = useState(FilterMode.ALL);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState(null);
	const [hasGroupsAccess, setHasGroupsAccess] = useState(false);

	const perPage = 7;

	const targetScope = 'groups';

	const router = useRouter();

	useEffect(() => {
		StrawberryBackend.hasScope(targetScope)
		.then((ok) => {
			setHasGroupsAccess(ok);
		})
	}, []);

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
			if (!hasGroupsAccess) {
				return
			}
			promise = StrawberryBackend.getGroups(currentPage, perPage, mode)
		}
		promise.then((resp) => {
			StrawberryBackend.hasScope(targetScope)
			.then((ok) => {
				setHasGroupsAccess(ok);
				setTotalPages(resp.count);
				setGroups(resp.items);
			})
		}).finally(() => {
			setIsLoading(false);
		})
	}, [searchQuery, filterMode, currentPage, hasGroupsAccess]);

	return (
		<Group>
			<GroupListHeader
				hasGroupsAccess={hasGroupsAccess}
				searchQuery={searchQuery}
				groups={groups}
				totalPages={totalPages}
				currentPage={currentPage}
				filterMode={filterMode}
				setCurrentPage={setCurrentPage}
				setFilterMode={setFilterMode}
				setSearchQuery={setSearchQuery}
			/>
			<Spacing size={24}>
				<Separator />
			</Spacing>
			<GroupListContent
				hasGroupsAccess={hasGroupsAccess}
				isLoading={isLoading}
				setHasGroupsAccess={setHasGroupsAccess}
				setCurrentPage={setCurrentPage}
				groups={groups}
				handleGenerate={handleGenerate}
			/>
		</Group>
	)
}

export default GroupList;
