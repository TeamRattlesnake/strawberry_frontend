import React, { useEffect, useState } from 'react';

import { Panel, PanelHeader, Group, Cell, Div, Avatar, RichCell, IconButton, Spacing, Separator, Pagination, Spinner } from '@vkontakte/vkui';
import { Icon24StarsOutline } from '@vkontakte/icons';
import StrawberryBackend from '../api/SBBackend';


const GroupList = ({ go, dataset }) => {
	const [groups, setGroups] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(false);

	const perPage = 7;

	const onGenerate = (group) => {
		StrawberryBackend.fetchGroupPosts(group.id, 5)
		.then((texts) => {
			if (!texts) {
				dataset.showSnackBar({text: `Ошибка во время извлечения тематики группы`, type: "danger"});
				return
			}
			if (texts.length == 0) {
				dataset.showSnackBar({text: `Не хватает постов для построения тематики этой группы`, type: "danger"});
				return
			}
			group.texts = texts
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
		setIsLoading(true);
		StrawberryBackend.getGroupsManaged(currentPage, perPage)
		.then((resp) => {
			setTotalPages(resp.count);
			setGroups(resp.items);
		}).finally(() => {
			setIsLoading(false);
		})
	}, [currentPage]);

	return (
		<Group>
			{
				isLoading && <Div><Spinner/></Div>
			}
			{
				!isLoading && groups && totalPages > 1 && (
					<>
						<Pagination
							currentPage={currentPage}
							siblingCount={1}
							boundaryCount={1}
							totalPages={totalPages}
							onChange={(page) => setCurrentPage(page)}
							
						/>
						<Spacing size={24}>
							<Separator />
						</Spacing>
					</>
				)
			}
			{
				!isLoading && groups && groups.map((group, idx) => {
					return (
						<RichCell
							key={idx}
							before={<Avatar src={group.photo_200}/>}
							after={
								<RichCell.Icon aria-hidden>
									<IconButton onClick={() => onGenerate(group)}>
										 <Icon24StarsOutline aria-label='Сгенерировать'/>
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
