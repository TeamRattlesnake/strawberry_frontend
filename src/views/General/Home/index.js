import React from 'react';

import PanelWrapper from '../../PanelWrapper';
import GroupList from './GroupList';


const Home = ({ id, go, dataset }) => {
	return (
		<PanelWrapper id={id}>
			<GroupList go={go} dataset={dataset}/>
		</PanelWrapper>
	);
};

export default Home;
