import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  borderContainer: {
    border: '4pt double #0f2537',
    padding: 30,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f2537',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#555',
    marginBottom: 20,
  },
  certTitle: {
    fontSize: 22,
    textAlign: 'center',
    marginVertical: 15,
    color: '#8a6d3b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statement: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 1.6,
    marginHorizontal: 20,
    marginVertical: 15,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0f2537',
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 40,
  },
  signBlock: {
    width: 180,
    borderTop: '1pt solid #333',
    textAlign: 'center',
    paddingTop: 5,
    fontSize: 11,
  },
  stamp: {
    width: 90,
    height: 90,
  }
});

export const CertificatePdf = ({ name, jurisdiction, percentage }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.borderContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Aegis Flag Registry Corporation</Text>
          <Text style={styles.subtitle}>
            Delaware Corporation • File Number: DE 10677842 • Incorporated: June 26, 2026
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.certTitle}>Certificate of Ownership Share</Text>

        {/* Text Body */}
        <Text style={styles.statement}>
          This certifies that <Text style={styles.boldText}>{name}</Text>, incorporated in <Text style={styles.boldText}>{jurisdiction}</Text>, is the registered holder of <Text style={styles.boldText}>{percentage}%</Text> of the total authorized capital stock of Aegis Flag Registry Corporation.
        </Text>

        {/* Footer Area with Stamp and Signature */}
        <View style={styles.footer}>
          <View style={{ fontSize: 10, color: '#777' }}>
            <Text>Certificate Date: {new Date().toLocaleDateString()}</Text>
          </View>
          
          {/* Stamp Placeholder (Points to your public asset folder) */}
          <Image src="http://localhost:4321/stamp.png" style={styles.stamp} />

          <View style={styles.signBlock}>
            <Text>Authorized Director</Text>
          </View>
        </View>

      </View>
    </Page>
  </Document>
);