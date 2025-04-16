import React from 'react';

interface FadeLoaderProps {
  color?: string;
  loading?: boolean;
  height?: number;
  width?: number;
  margin?: number;
  radius?: number;
}

export const FadeLoader: React.FC<FadeLoaderProps> = ({
  color = '#8975EA',
  loading = true,
  height = 15,
  width = 5,
  margin = 2,
  radius = 2,
}) => {
  if (!loading) return null;

  const styles = {
    wrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    },
    loader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: `${margin * 2}px`,
    },
    bar: {
      backgroundColor: color,
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: `${radius}px`,
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.loader}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <div
            key={index}
            style={{
              ...styles.bar,
              animation: `fadeLoader 1.2s ${
                index * 0.12
              }s infinite ease-in-out both`,
            }}
          />
        ))}
      </div>
      <style jsx global>{`
        @keyframes fadeLoader {
          0%,
          100% {
            opacity: 0.1;
            transform: scaleY(0.4);
          }
          50% {
            opacity: 1;
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
};
