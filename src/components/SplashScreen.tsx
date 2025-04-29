import React, {useEffect, useState} from 'react';
import {View, Image, StyleSheet} from 'react-native';

interface SplashScreenProps {
	onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({onFinish}) => {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		// Display splash screen for 3 seconds
		const timer = setTimeout(() => {
			setVisible(false);
			onFinish();
		}, 3000);

		return () => clearTimeout(timer);
	}, [onFinish]);

	if (!visible) return null;

	return (
		<View style={styles.container}>
			<Image
				source={require('../../assets/images/logo-dark-animated.gif')}
				style={styles.logo}
				resizeMode="contain"
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 10,
	},
	logo: {
		width: 150,
		height: 150,
	},
});

export default SplashScreen;