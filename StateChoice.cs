using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class StateChoice : MonoBehaviour
{
    //PlayerPrefs.SetString("title", string.Join("###", anArray));
    //var anArray = PlayerPrefs.SetString("title").Split(new []{"###"}, StringSplitOptions.None);
    public Slider internetAds;
    public Slider TVAds;
    public Slider Mailers;
    public List<string> lines;
    public TextAsset txt;
    public TMP_Dropdown m_dropdown;
    public List<string> stateNames;
    public Dictionary<string, string> stateData = new Dictionary<string, string>();
    public string[] dataArr = new string[3];
    public GeneralAdSpending gas;
    public float maxDivisor = 10;

    // Start is called before the first frame update
    void Start()
    {
        float balance = (float)Variables.Saved.Get("CampaignBalance");
        TextAsset txt = (TextAsset)Resources.Load("GeneralElection", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        for (int i = 0; i < lines.Count; i++)
        {
            List<string> l = new List<string>(lines[i].Split('\t').ToList());
            stateNames.Add(l[0]);
            if (!stateData.ContainsKey(l[0]))
            {
                dataArr[0] = internetAds.value.ToString();
                dataArr[1] = TVAds.value.ToString();
                dataArr[2] = Mailers.value.ToString();
                stateData[l[0]] = string.Join('\n', dataArr);
            }
        }
        m_dropdown = gameObject.GetComponent<TMP_Dropdown>();
        m_dropdown.AddOptions(stateNames);
        m_dropdown.onValueChanged.AddListener(delegate {DropdownValueChanged(m_dropdown);});
        internetAds.onValueChanged.AddListener(delegate {callSpendingUpdate(m_dropdown);});
        TVAds.onValueChanged.AddListener(delegate {callSpendingUpdate(m_dropdown);});
        Mailers.onValueChanged.AddListener(delegate {callSpendingUpdate(m_dropdown);});
        internetAds.maxValue = balance/maxDivisor;
        TVAds.maxValue = balance/maxDivisor;
        Mailers.maxValue = balance/maxDivisor;
        if (stateData.ContainsKey(m_dropdown.options[m_dropdown.value].text))
        {
            var anArray = stateData[m_dropdown.options[m_dropdown.value].text].Split('\n');
            internetAds.value = float.Parse(anArray[0]);
            TVAds.value = float.Parse(anArray[1]);
            Mailers.value = float.Parse(anArray[2]);
            
        }
    }

    // Update is called once per frame
    void Update()
    {
    }

    public void DropdownValueChanged(TMP_Dropdown change)
    {
        if (stateData.ContainsKey(change.options[change.value].text))
        {
            var anArray = stateData[change.options[change.value].text].Split('\n');
            internetAds.value = float.Parse(anArray[0]);
            TVAds.value = float.Parse(anArray[1]);
            Mailers.value = float.Parse(anArray[2]);
        }
        else
        {
            internetAds.value = 0f;
            TVAds.value = 0f;
            Mailers.value = 0f;
        }
        callSpendingUpdate(m_dropdown);
    }

    void callSpendingUpdate(TMP_Dropdown change)
    {
        string sName = gameObject.GetComponentInChildren<TextMeshProUGUI>().text;
        dataArr[0] = internetAds.value.ToString();
        dataArr[1] = TVAds.value.ToString();
        dataArr[2] = Mailers.value.ToString();
        stateData[sName] = string.Join('\n', dataArr);
        gas.UpdateBar();
    }
}
